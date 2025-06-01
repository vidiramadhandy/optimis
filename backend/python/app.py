# python/app.py - KODE LENGKAP DENGAN AUTO-RESET ID
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import numpy as np
import pandas as pd
from catboost import CatBoostClassifier
import os
import json
import joblib
from datetime import datetime
import traceback
import time
import threading
from concurrent.futures import ThreadPoolExecutor

app = Flask(__name__)
CORS(app)

# Konfigurasi Database
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'optipredict_database'
}

# Konfigurasi Model dan Scaler (dari notebook)
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'catboost_model_2.cbm')
SNR_SCALER_PATH = os.path.join(os.path.dirname(__file__), 'snr_minmax_scaler_untuk_prediksi.pkl')

# Prediction Labels (dari notebook)
PREDICTION_LABELS = {
    0: "Normal", 
    1: "Fiber Tapping", 
    2: "Bad Splice", 
    3: "Bending Event",
    4: "Dirty Connector", 
    5: "Fiber Cut", 
    6: "PC Connector", 
    7: "Reflector"
}

# Global variables
model = None
snr_scaler = None
executor = ThreadPoolExecutor(max_workers=4)

def load_model_and_scaler():
    """Load model dan scaler seperti di notebook dengan optimasi"""
    global model, snr_scaler
    try:
        print("🔄 Loading CatBoost model and SNR scaler...")
        
        # Load CatBoost model
        if os.path.exists(MODEL_PATH):
            model = CatBoostClassifier()
            model.load_model(MODEL_PATH)
            print(f"✅ Model '{MODEL_PATH}' berhasil dimuat.")
        else:
            print(f"❌ File model '{MODEL_PATH}' tidak ditemukan!")
            return False
            
        # Load SNR Scaler
        if os.path.exists(SNR_SCALER_PATH):
            try:
                snr_scaler = joblib.load(SNR_SCALER_PATH)
                print(f"✅ Scaler SNR '{SNR_SCALER_PATH}' berhasil dimuat.")
            except Exception as e:
                print(f"❌ Gagal memuat scaler SNR: {e}")
                snr_scaler = None
                return False
        else:
            print(f"❌ File scaler SNR '{SNR_SCALER_PATH}' tidak ditemukan!")
            return False
            
        # Verifikasi model seperti di notebook
        print(f"🔍 Model CBM Verification:")
        print(f"   - Model Type: {type(model).__name__}")
        print(f"   - Is CatBoost: {isinstance(model, CatBoostClassifier)}")
        print(f"   - Tree Count: {getattr(model, 'tree_count_', 'Unknown')}")
        print(f"   - Feature Count: {getattr(model, 'feature_count_', 'Unknown')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading model/scaler: {e}")
        traceback.print_exc()
        return False

def predict_instance_with_confidence(model, input_data_processed_np):
    """Prediksi dengan confidence seperti di notebook - optimized"""
    if model is None:
        return "Model tidak dimuat", None
    
    try:
        start_time = time.time()
        
        if input_data_processed_np.ndim == 1:
            input_data_processed_np = input_data_processed_np.reshape(1, -1)
        
        # Dapatkan probabilitas untuk semua kelas
        probabilities = model.predict_proba(input_data_processed_np)
        
        # Dapatkan kelas yang diprediksi (indeks dengan probabilitas tertinggi)
        predicted_class_index = np.argmax(probabilities, axis=1)[0]
        
        # Dapatkan label nama kelasnya
        predicted_label_name = PREDICTION_LABELS.get(predicted_class_index, "Kelas Tidak Dikenal")
        
        # Dapatkan confidence (probabilitas dari kelas yang diprediksi)
        confidence_score = probabilities[0][predicted_class_index]
        
        prediction_time = time.time() - start_time
        print(f"⏱️ Prediction completed in {prediction_time:.3f} seconds")
        
        return predicted_label_name, confidence_score * 100  # Kembalikan sebagai persentase
        
    except Exception as e:
        return f"Error saat prediksi: {e}", None

# PERBAIKAN: Fungsi untuk reset AUTO_INCREMENT ketika tabel kosong
def reset_auto_increment_if_empty(table_name, conn):
    """Reset AUTO_INCREMENT ke 1 jika tabel kosong"""
    try:
        cursor = conn.cursor()
        
        # Cek apakah tabel kosong
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        
        if count == 0:
            # Jika tabel kosong, reset AUTO_INCREMENT ke 1
            cursor.execute(f"ALTER TABLE {table_name} AUTO_INCREMENT = 1")
            print(f"✅ AUTO_INCREMENT reset to 1 for empty table: {table_name}")
            return True
        else:
            print(f"📊 Table {table_name} has {count} records, AUTO_INCREMENT not reset")
            return False
            
    except Exception as e:
        print(f"❌ Error resetting AUTO_INCREMENT for {table_name}: {e}")
        return False

# PERBAIKAN: Fungsi untuk check dan reset kedua tabel jika diperlukan
def check_and_reset_tables(conn):
    """Check dan reset AUTO_INCREMENT untuk kedua tabel jika kosong"""
    try:
        cursor = conn.cursor()
        
        # Check fiber_predictions table
        cursor.execute("SELECT COUNT(*) FROM fiber_predictions")
        fp_count = cursor.fetchone()[0]
        
        # Check manual_inputs table  
        cursor.execute("SELECT COUNT(*) FROM manual_inputs")
        mi_count = cursor.fetchone()[0]
        
        reset_info = {
            'fiber_predictions_reset': False,
            'manual_inputs_reset': False,
            'fiber_predictions_count': fp_count,
            'manual_inputs_count': mi_count
        }
        
        # Reset jika tabel kosong
        if fp_count == 0:
            cursor.execute("ALTER TABLE fiber_predictions AUTO_INCREMENT = 1")
            reset_info['fiber_predictions_reset'] = True
            print("✅ fiber_predictions AUTO_INCREMENT reset to 1")
        
        if mi_count == 0:
            cursor.execute("ALTER TABLE manual_inputs AUTO_INCREMENT = 1")
            reset_info['manual_inputs_reset'] = True
            print("✅ manual_inputs AUTO_INCREMENT reset to 1")
        
        return reset_info
        
    except Exception as e:
        print(f"❌ Error checking/resetting tables: {e}")
        return None

def save_to_database_async(user_id, inputs_float, snr_raw_float, prediction_label, confidence, user_data, snr_normalized, input_type):
    """Async database save dengan auto-reset ID"""
    try:
        start_time = time.time()
        print(f"💾 Starting async database save for user {user_id}...")
        
        conn = mysql.connector.connect(**DB_CONFIG)
        
        # PERBAIKAN: Check dan reset AUTO_INCREMENT jika tabel kosong
        reset_info = check_and_reset_tables(conn)
        if reset_info:
            print(f"🔄 Reset info: {reset_info}")
        
        cursor = conn.cursor()
        
        # Simpan manual input
        manual_query = """
        INSERT INTO manual_inputs (
            user_id, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10,
            p11, p12, p13, p14, p15, p16, p17, p18, p19, p20,
            p21, p22, p23, p24, p25, p26, p27, p28, p29, p30, snr
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                 %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                 %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(manual_query, [user_id] + inputs_float + [snr_raw_float])
        manual_input_id = cursor.lastrowid
        
        # Simpan prediksi
        quality = 'excellent' if confidence >= 90 else 'good' if confidence >= 70 else 'fair' if confidence >= 50 else 'poor'
        
        prediction_result_json = {
            'prediction': prediction_label,
            'confidence_percentage': confidence,
            'user_name': user_data[1],
            'snr_raw': snr_raw_float,
            'snr_normalized': snr_normalized,
            'model_info': {
                'model_type': 'CatBoostClassifier',
                'uses_snr_scaler': True,
                'feature_order': 'SNR_normalized + P1-P30',
                'prediction_labels': PREDICTION_LABELS
            }
        }
        
        prediction_query = """
        INSERT INTO fiber_predictions (
            user_id, input_type, manual_input_id, prediction_result, 
            confidence_score, quality_assessment, model_version
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(prediction_query, (
            user_id, input_type, manual_input_id, 
            json.dumps(prediction_result_json),
            confidence / 100, quality, 'CBM-v2-optimized'
        ))
        
        prediction_id = cursor.lastrowid
        conn.commit()
        cursor.close()
        conn.close()
        
        save_time = time.time() - start_time
        print(f"✅ Async database save completed in {save_time:.3f}s - Prediction ID: {prediction_id}")
        
        return prediction_id, manual_input_id
        
    except Exception as e:
        print(f"❌ Async database save error: {e}")
        traceback.print_exc()
        return None, None

def get_db_connection():
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except Exception as e:
        print(f"Error koneksi database: {e}")
        return None

def verify_user_exists(user_id):
    """Verifikasi user exists di database - optimized"""
    try:
        conn = get_db_connection()
        if not conn:
            return False
            
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email FROM users WHERE id = %s", (user_id,))
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if result:
            return result
        else:
            return False
            
    except Exception as e:
        print(f"Error verifying user: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Flask ML service berjalan',
        'model_loaded': model is not None,
        'snr_scaler_loaded': snr_scaler is not None,
        'model_type': type(model).__name__ if model else None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Enhanced prediction dengan auto-reset ID"""
    request_start_time = time.time()
    
    try:
        data = request.get_json()
        
        inputs = data.get('inputs', [])
        snr_raw = data.get('snr')  # SNR mentah (0-30)
        user_id = data.get('userId')
        input_type = data.get('inputType', 'Manual').lower()
        
        print(f"🔍 ML Prediction Request (User {user_id}):")
        print(f"   - SNR (raw): {snr_raw}")
        print(f"   - Inputs length: {len(inputs)}")
        print(f"   - Input type: {input_type}")
        
        # Validasi input cepat
        if not user_id or len(inputs) != 30 or snr_raw is None:
            return jsonify({
                'success': False,
                'message': 'Input tidak valid - diperlukan 30 parameter dan SNR'
            }), 400
        
        # Konversi ke float dengan error handling
        try:
            inputs_float = [float(x) if x != '' else 0.0 for x in inputs]
            snr_raw_float = float(snr_raw)
        except ValueError as ve:
            return jsonify({
                'success': False,
                'message': f'Error konversi data: {str(ve)}'
            }), 400
        
        # Validasi range seperti di notebook (P1-P30: 0-1, SNR: 0-30)
        if any(x < 0 or x > 1 for x in inputs_float):
            return jsonify({
                'success': False,
                'message': 'Input P1-P30 harus antara 0-1'
            }), 400
            
        if snr_raw_float < 0 or snr_raw_float > 30:
            return jsonify({
                'success': False,
                'message': 'SNR harus antara 0-30'
            }), 400
        
        # Deteksi SNR tinggi untuk optimasi
        is_high_snr = snr_raw_float > 10
        if is_high_snr:
            print(f"⚠️ High SNR detected ({snr_raw_float}), using optimized processing...")
        
        # Verifikasi user dan model
        user_data = verify_user_exists(user_id)
        if not user_data:
            return jsonify({
                'success': False,
                'message': f'User dengan ID {user_id} tidak ditemukan'
            }), 404
        
        if model is None or snr_scaler is None:
            return jsonify({
                'success': False,
                'message': 'Model CBM atau SNR Scaler tidak tersedia'
            }), 500
        
        # NORMALISASI SNR seperti di notebook
        print(f"🔄 Normalizing SNR...")
        try:
            snr_df = pd.DataFrame([[snr_raw_float]], columns=['SNR'])
            snr_normalized_array = snr_scaler.transform(snr_df)
            snr_normalized = snr_normalized_array[0][0]
            
            print(f"   - SNR Raw: {snr_raw_float}")
            print(f"   - SNR Normalized: {snr_normalized}")
        except Exception as norm_error:
            print(f"❌ Error normalizing SNR: {norm_error}")
            return jsonify({
                'success': False,
                'message': f'Error normalisasi SNR: {str(norm_error)}'
            }), 500
        
        # PREDIKSI DENGAN MODEL CBM seperti di notebook
        print(f"🤖 Memulai prediksi CBM untuk user: {user_data[1]}")
        
        try:
            # Gabungkan SNR normalized dengan P1-P30 seperti di notebook
            features = [snr_normalized] + inputs_float
            features_array = np.array([features])
            
            print(f"🔍 Features shape: {features_array.shape}")
            print(f"   - SNR (normalized): {snr_normalized}")
            print(f"   - P1-P30 range: {min(inputs_float):.3f} - {max(inputs_float):.3f}")
            
            # Prediksi dengan confidence seperti di notebook
            prediction_label, confidence = predict_instance_with_confidence(model, features_array)
            
            if confidence is None:
                return jsonify({
                    'success': False,
                    'message': f'Error prediksi: {prediction_label}'
                }), 500
            
            print(f"✅ PREDIKSI CBM BERHASIL!")
            print(f"   - Prediction Label: {prediction_label}")
            print(f"   - Confidence: {confidence:.2f}%")
            
        except Exception as pred_error:
            print(f"❌ ERROR PREDIKSI CBM: {pred_error}")
            traceback.print_exc()
            return jsonify({
                'success': False,
                'message': f'Error prediksi model CBM: {str(pred_error)}'
            }), 500
        
        # OPTIMASI: Return response immediately untuk SNR tinggi, save database async
        prediction_time = time.time() - request_start_time
        print(f"⏱️ Prediction completed in {prediction_time:.3f}s")
        
        if is_high_snr:
            # Untuk SNR tinggi: return response segera, database save async
            print(f"🚀 High SNR: Returning immediate response, saving to database asynchronously...")
            
            # Start async database save dengan auto-reset
            future = executor.submit(
                save_to_database_async, 
                user_id, inputs_float, snr_raw_float, 
                prediction_label, confidence, user_data, 
                snr_normalized, input_type
            )
            
            # Return immediate response
            return jsonify({
                'success': True,
                'data': {
                    'prediction': prediction_label,
                    'confidence': confidence / 100,
                    'quality_assessment': 'excellent' if confidence >= 90 else 'good' if confidence >= 70 else 'fair',
                    'timestamp': datetime.now().isoformat(),
                    'user_id': user_id,
                    'snr_info': {
                        'raw': snr_raw_float,
                        'normalized': snr_normalized
                    },
                    'user_info': {
                        'id': user_data[0],
                        'name': user_data[1],
                        'email': user_data[2]
                    },
                    'model_info': {
                        'model_type': 'CatBoostClassifier',
                        'uses_snr_scaler': True,
                        'prediction_labels': PREDICTION_LABELS
                    },
                    'processing_time': prediction_time,
                    'database_status': 'saving_async',
                    'high_snr_optimization': True
                },
                'message': f'Prediksi CBM berhasil untuk {user_data[1]}! Result: {prediction_label} (Confidence: {confidence:.2f}%) - Database saving in background'
            })
        
        else:
            # Untuk SNR rendah: save database synchronous dengan auto-reset
            print(f"💾 Low SNR: Saving to database synchronously...")
            conn = get_db_connection()
            if not conn:
                return jsonify({
                    'success': True,
                    'data': {
                        'prediction': prediction_label,
                        'confidence': confidence / 100,
                        'quality_assessment': 'excellent' if confidence >= 90 else 'good',
                        'timestamp': datetime.now().isoformat(),
                        'user_id': user_id,
                        'warning': 'Prediction successful but database connection failed'
                    },
                    'message': f'Prediksi CBM berhasil: {prediction_label} (Confidence: {confidence:.2f}%)'
                })
            
            try:
                # PERBAIKAN: Check dan reset AUTO_INCREMENT jika tabel kosong
                reset_info = check_and_reset_tables(conn)
                if reset_info:
                    print(f"🔄 Reset info: {reset_info}")
                
                cursor = conn.cursor()
                
                # Simpan manual input
                manual_query = """
                INSERT INTO manual_inputs (
                    user_id, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10,
                    p11, p12, p13, p14, p15, p16, p17, p18, p19, p20,
                    p21, p22, p23, p24, p25, p26, p27, p28, p29, p30, snr
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                         %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                         %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(manual_query, [user_id] + inputs_float + [snr_raw_float])
                manual_input_id = cursor.lastrowid
                
                # Simpan prediksi
                quality = 'excellent' if confidence >= 90 else 'good' if confidence >= 70 else 'fair' if confidence >= 50 else 'poor'
                
                prediction_result_json = {
                    'prediction': prediction_label,
                    'confidence_percentage': confidence,
                    'user_name': user_data[1],
                    'snr_raw': snr_raw_float,
                    'snr_normalized': snr_normalized,
                    'model_info': {
                        'model_type': 'CatBoostClassifier',
                        'uses_snr_scaler': True,
                        'feature_order': 'SNR_normalized + P1-P30',
                        'prediction_labels': PREDICTION_LABELS
                    }
                }
                
                prediction_query = """
                INSERT INTO fiber_predictions (
                    user_id, input_type, manual_input_id, prediction_result, 
                    confidence_score, quality_assessment, model_version
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                
                cursor.execute(prediction_query, (
                    user_id, input_type, manual_input_id, 
                    json.dumps(prediction_result_json),
                    confidence / 100, quality, 'CBM-v2-optimized'
                ))
                
                prediction_id = cursor.lastrowid
                conn.commit()
                cursor.close()
                conn.close()
                
                total_time = time.time() - request_start_time
                print(f"✅ Prediction saved with ID: {prediction_id}")
                print(f"⏱️ Total request time: {total_time:.3f}s")
                
                return jsonify({
                    'success': True,
                    'data': {
                        'id': prediction_id,
                        'prediction': prediction_label,
                        'confidence': confidence / 100,
                        'quality_assessment': quality,
                        'timestamp': datetime.now().isoformat(),
                        'user_id': user_id,
                        'manual_input_id': manual_input_id,
                        'snr_info': {
                            'raw': snr_raw_float,
                            'normalized': snr_normalized
                        },
                        'user_info': {
                            'id': user_data[0],
                            'name': user_data[1],
                            'email': user_data[2]
                        },
                        'model_info': {
                            'model_type': 'CatBoostClassifier',
                            'uses_snr_scaler': True,
                            'prediction_labels': PREDICTION_LABELS
                        },
                        'processing_time': total_time,
                        'database_status': 'saved_sync',
                        'auto_increment_reset': reset_info
                    },
                    'message': f'Prediksi CBM berhasil untuk {user_data[1]}! Result: {prediction_label} (Confidence: {confidence:.2f}%)'
                })
                
            except Exception as db_error:
                print(f"❌ Database Error: {db_error}")
                if conn:
                    conn.rollback()
                    cursor.close()
                    conn.close()
                
                # Return prediction result even if database save fails
                return jsonify({
                    'success': True,
                    'data': {
                        'prediction': prediction_label,
                        'confidence': confidence / 100,
                        'quality_assessment': 'excellent' if confidence >= 90 else 'good',
                        'timestamp': datetime.now().isoformat(),
                        'user_id': user_id,
                        'warning': 'Prediction successful but database save failed'
                    },
                    'message': f'Prediksi CBM berhasil: {prediction_label} (Confidence: {confidence:.2f}%)'
                })
            
    except Exception as e:
        total_time = time.time() - request_start_time
        print(f"❌ Error umum (after {total_time:.3f}s): {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Terjadi kesalahan: {str(e)}'
        }), 500

@app.route('/prediction/<int:prediction_id>', methods=['GET'])
def get_prediction_detail(prediction_id):
    """Get detail prediksi berdasarkan ID"""
    try:
        user_id = request.args.get('userId')
        
        print(f"🔍 Getting prediction detail for ID: {prediction_id}, User: {user_id}")
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Gagal koneksi database'})
        
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT 
            fp.*,
            mi.p1, mi.p2, mi.p3, mi.p4, mi.p5, mi.p6, mi.p7, mi.p8, mi.p9, mi.p10,
            mi.p11, mi.p12, mi.p13, mi.p14, mi.p15, mi.p16, mi.p17, mi.p18, mi.p19, mi.p20,
            mi.p21, mi.p22, mi.p23, mi.p24, mi.p25, mi.p26, mi.p27, mi.p28, mi.p29, mi.p30,
            mi.snr, mi.created_at as input_created_at,
            u.name as user_name, u.email as user_email
        FROM fiber_predictions fp
        JOIN manual_inputs mi ON fp.manual_input_id = mi.id
        JOIN users u ON fp.user_id = u.id
        WHERE fp.id = %s AND fp.user_id = %s
        """
        
        cursor.execute(query, (prediction_id, user_id))
        result = cursor.fetchone()
        
        if not result:
            print(f"❌ Prediction not found: ID {prediction_id} for user {user_id}")
            return jsonify({
                'success': False,
                'message': 'Data prediksi tidak ditemukan'
            }), 404
        
        if result['prediction_result']:
            try:
                result['prediction_result'] = json.loads(result['prediction_result'])
            except json.JSONDecodeError:
                print(f"⚠️ Failed to parse prediction_result for ID {prediction_id}")
                result['prediction_result'] = None
        
        cursor.close()
        conn.close()
        
        print(f"✅ Prediction detail retrieved for ID: {prediction_id}")
        
        return jsonify({
            'success': True,
            'data': result,
            'message': 'Data prediksi berhasil diambil'
        })
        
    except Exception as e:
        print(f"❌ Error getting prediction detail: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/predictions/<int:user_id>', methods=['GET'])
def get_user_predictions(user_id):
    """Get predictions history untuk user tertentu"""
    try:
        limit = request.args.get('limit', 10, type=int)
        
        print(f"🔍 Getting predictions for user {user_id} with limit {limit}")
        
        conn = get_db_connection()
        if not conn:
            print("❌ Database connection failed")
            return jsonify({'success': False, 'message': 'Gagal koneksi database'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT 
            fp.*,
            mi.p1, mi.p2, mi.p3, mi.p4, mi.p5, mi.snr, 
            mi.created_at as input_created,
            u.name as user_name, u.email as user_email
        FROM fiber_predictions fp
        JOIN manual_inputs mi ON fp.manual_input_id = mi.id
        JOIN users u ON fp.user_id = u.id
        WHERE fp.user_id = %s
        ORDER BY fp.created_at DESC
        LIMIT %s
        """
        
        print(f"🔍 Executing query for user {user_id}")
        cursor.execute(query, (user_id, limit))
        results = cursor.fetchall()
        
        print(f"✅ Found {len(results)} predictions for user {user_id}")
        
        for result in results:
            if result['prediction_result']:
                try:
                    result['prediction_result'] = json.loads(result['prediction_result'])
                except json.JSONDecodeError:
                    print(f"⚠️ Failed to parse prediction_result for ID {result['id']}")
                    result['prediction_result'] = None
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': results,
            'count': len(results),
            'message': f'Successfully retrieved {len(results)} predictions for user {user_id}'
        })
        
    except Exception as e:
        print(f"❌ Error getting user predictions: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/prediction/<int:prediction_id>', methods=['DELETE'])
def delete_prediction(prediction_id):
    """Hapus prediksi berdasarkan ID dengan auto-reset jika tabel menjadi kosong"""
    try:
        user_id = request.args.get('userId')
        
        print(f"🗑️ Deleting prediction ID: {prediction_id} for user: {user_id}")
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'User ID diperlukan'
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Gagal koneksi database'})
        
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, manual_input_id FROM fiber_predictions WHERE id = %s AND user_id = %s", 
                      (prediction_id, user_id))
        prediction = cursor.fetchone()
        
        if not prediction:
            cursor.close()
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Prediksi tidak ditemukan atau bukan milik Anda'
            }), 404
        
        manual_input_id = prediction[1]
        
        cursor.execute("DELETE FROM fiber_predictions WHERE id = %s", (prediction_id,))
        
        if manual_input_id:
            cursor.execute("DELETE FROM manual_inputs WHERE id = %s", (manual_input_id,))
        
        conn.commit()
        
        # PERBAIKAN: Check dan reset AUTO_INCREMENT setelah delete jika tabel kosong
        reset_info = check_and_reset_tables(conn)
        
        cursor.close()
        conn.close()
        
        print(f"✅ Prediksi ID {prediction_id} berhasil dihapus")
        if reset_info:
            print(f"🔄 Auto-reset info after delete: {reset_info}")
        
        return jsonify({
            'success': True,
            'message': 'Prediksi berhasil dihapus',
            'auto_increment_reset': reset_info
        })
        
    except Exception as e:
        print(f"❌ Error deleting prediction: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/predictions/all/<int:user_id>', methods=['DELETE'])
def delete_all_predictions(user_id):
    """Hapus semua prediksi user dengan auto-reset ID"""
    try:
        print(f"🗑️ Deleting all predictions for user: {user_id}")
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Gagal koneksi database'})
        
        cursor = conn.cursor()
        
        cursor.execute("SELECT manual_input_id FROM fiber_predictions WHERE user_id = %s", (user_id,))
        manual_input_ids = cursor.fetchall()
        
        cursor.execute("DELETE FROM fiber_predictions WHERE user_id = %s", (user_id,))
        deleted_predictions = cursor.rowcount
        
        if manual_input_ids:
            manual_ids = [row[0] for row in manual_input_ids if row[0]]
            if manual_ids:
                format_strings = ','.join(['%s'] * len(manual_ids))
                cursor.execute(f"DELETE FROM manual_inputs WHERE id IN ({format_strings})", manual_ids)
        
        conn.commit()
        
        # PERBAIKAN: Check dan reset AUTO_INCREMENT setelah delete all
        reset_info = check_and_reset_tables(conn)
        
        cursor.close()
        conn.close()
        
        print(f"✅ Semua prediksi user {user_id} berhasil dihapus ({deleted_predictions} records)")
        if reset_info:
            print(f"🔄 Auto-reset info after delete all: {reset_info}")
        
        return jsonify({
            'success': True,
            'message': f'Berhasil menghapus {deleted_predictions} prediksi',
            'deleted_count': deleted_predictions,
            'auto_increment_reset': reset_info
        })
        
    except Exception as e:
        print(f"❌ Error deleting all predictions: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

# TAMBAHAN: Endpoint untuk manual reset AUTO_INCREMENT
@app.route('/reset-auto-increment', methods=['POST'])
def manual_reset_auto_increment():
    """Manual reset AUTO_INCREMENT untuk kedua tabel"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Gagal koneksi database'})
        
        reset_info = check_and_reset_tables(conn)
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Auto-increment reset completed',
            'reset_info': reset_info
        })
        
    except Exception as e:
        print(f"❌ Error manual reset: {e}")
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Enhanced Flask ML Service...")
    print("🔧 Flask dengan logic dari Jupyter Notebook")
    print("⚡ Optimized untuk SNR tinggi dengan async database save")
    print("🔄 Auto-reset ID ketika tabel kosong")
    print("=" * 50)
    
    # Load model dan scaler saat startup
    model_loaded = load_model_and_scaler()
    if model_loaded:
        print("✅ Model CBM dan SNR Scaler siap digunakan")
        print("✅ Notebook logic berhasil diintegrasikan")
    else:
        print("❌ Model CBM atau SNR Scaler gagal dimuat")
    
    print("=" * 50)
    print("🌐 Enhanced Flask ML service running on http://0.0.0.0:5001")
    print("📋 Endpoints tersedia:")
    print("   - GET  /health")
    print("   - POST /predict (dengan auto-reset ID)")
    print("   - GET  /prediction/<id>")
    print("   - DELETE /prediction/<id> (dengan auto-reset ID)")
    print("   - GET  /predictions/<user_id>")
    print("   - DELETE /predictions/all/<user_id> (dengan auto-reset ID)")
    print("   - POST /reset-auto-increment (manual reset)")
    
    # Konfigurasi untuk mengatasi timeout dan SNR tinggi
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    app.run(debug=True, host='0.0.0.0', port=5001, threaded=True)
