# app.py - Flask ML Service dengan BATCH PROCESSING OPTIMIZATION + HISTORY ENDPOINT
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import pooling
import numpy as np
import pandas as pd
from catboost import CatBoostClassifier
import os
import json
import joblib
from datetime import datetime
import traceback
import time
from concurrent.futures import ThreadPoolExecutor
import re

app = Flask(__name__)
CORS(app)

# Konfigurasi Database dengan Connection Pool untuk XAMPP MySQL
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'capstone',
    'password': 'Adaptive6798',
    'database': 'optipredict_database',
    'pool_name': 'mypool',
    'pool_size': 5,
    'pool_reset_session': True,
    'autocommit': True,
    'connect_timeout': 30,
    'sql_mode': '',
    'charset': 'utf8mb4',
    'use_unicode': True,
    'connection_timeout': 30,
}

# Path model dan scaler
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'catboost_model_2.cbm')
SNR_SCALER_PATH = os.path.join(os.path.dirname(__file__), 'snr_minmax_scaler_untuk_prediksi.pkl')

# Label prediksi
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

model = None
snr_scaler = None
executor = ThreadPoolExecutor(max_workers=4)
connection_pool = None

def init_connection_pool():
    global connection_pool
    try:
        connection_pool = pooling.MySQLConnectionPool(**DB_CONFIG)
        print("✅ MySQL connection pool initialized successfully for XAMPP")
        return True
    except Exception as e:
        print(f"❌ Error initializing connection pool: {e}")
        print("⚠️ Pastikan XAMPP MySQL sudah berjalan di port 3306")
        return False

def load_model_and_scaler():
    global model, snr_scaler
    try:
        print("🔄 Loading CatBoost model and SNR scaler...")
        if os.path.exists(MODEL_PATH):
            model = CatBoostClassifier()
            model.load_model(MODEL_PATH)
            print(f"✅ Model '{MODEL_PATH}' berhasil dimuat.")
        else:
            print(f"❌ File model '{MODEL_PATH}' tidak ditemukan!")
            return False
        if os.path.exists(SNR_SCALER_PATH):
            snr_scaler = joblib.load(SNR_SCALER_PATH)
            print(f"✅ Scaler SNR '{SNR_SCALER_PATH}' berhasil dimuat.")
        else:
            print(f"❌ File scaler SNR '{SNR_SCALER_PATH}' tidak ditemukan!")
            return False
        return True
    except Exception as e:
        print(f"❌ Error loading model/scaler: {e}")
        traceback.print_exc()
        return False

def ensure_model_and_scaler():
    global model, snr_scaler
    if model is None or snr_scaler is None:
        print("⚠️ Model atau scaler belum dimuat, mencoba reload...")
        loaded = load_model_and_scaler()
        if not loaded:
            raise RuntimeError("Model atau scaler gagal dimuat")

def predict_batch_optimized(model, snr_scaler, snr_values, inputs_matrix):
    try:
        start_time = time.time()
        snr_array = np.array(snr_values, dtype=np.float32).reshape(-1, 1)
        inputs_array = np.array(inputs_matrix, dtype=np.float32)
        print(f"📊 Processing batch of {len(snr_values)} samples...")

        snr_normalized = snr_scaler.transform(snr_array).flatten()
        features_matrix = np.column_stack([snr_normalized, inputs_array])
        print(f"📊 Features matrix shape: {features_matrix.shape}")

        probabilities = model.predict_proba(features_matrix)
        predicted_classes = np.argmax(probabilities, axis=1)
        confidence_scores = np.max(probabilities, axis=1)
        predictions = [PREDICTION_LABELS.get(cls, "Unknown") for cls in predicted_classes]
        confidences = confidence_scores * 100
        processing_time = time.time() - start_time
        print(f"✅ Batch prediction completed in {processing_time:.2f} seconds")
        return predictions, confidences, snr_normalized
    except Exception as e:
        print(f"❌ Error in batch prediction: {e}")
        traceback.print_exc()
        return None, None, None

def batch_insert_predictions(user_id, predictions_data, batch_size=1000):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if not conn:
            return False
        cursor = conn.cursor()
        insert_query = """
            INSERT INTO predictions (
                user_id, prediction_number, snr, snr_normalized, inputs, 
                prediction, confidence, quality_assessment, input_type, 
                model_version, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        total_inserted = 0
        for i in range(0, len(predictions_data), batch_size):
            batch = predictions_data[i:i + batch_size]
            cursor.executemany(insert_query, batch)
            conn.commit()
            total_inserted += len(batch)
            print(f"📊 Inserted batch {i//batch_size + 1}: {total_inserted}/{len(predictions_data)} records")
        print(f"✅ Successfully inserted {total_inserted} predictions")
        return True
    except Exception as e:
        print(f"❌ Error in batch insert: {e}")
        return False
    finally:
        close_db_connection(conn, cursor)

def get_db_connection():
    global connection_pool
    conn = None
    try:
        if connection_pool is None:
            print("🔄 Initializing connection pool...")
            init_connection_pool()
        if connection_pool:
            conn = connection_pool.get_connection()
            if conn and conn.is_connected():
                print("✅ Database connection successful from pool (XAMPP)")
                return conn
            else:
                print("❌ Connection from pool is not active")
                if conn:
                    try:
                        conn.close()
                    except:
                        pass
                return None
        else:
            print("❌ Connection pool is None")
            return None
    except Exception as e:
        print(f"❌ Error getting connection from pool: {e}")
        if conn:
            try:
                conn.close()
            except:
                pass
        try:
            print("🔄 Attempting fallback direct connection...")
            conn = mysql.connector.connect(
                host='localhost',
                port=3306,
                user='root',
                password='',
                database='optipredict_database',
                autocommit=True,
                connect_timeout=30,
                charset='utf8mb4',
                use_unicode=True
            )
            if conn.is_connected():
                print("✅ Fallback direct connection successful (XAMPP)")
                return conn
            else:
                print("❌ Fallback connection failed")
                return None
        except Exception as fallback_error:
            print(f"❌ Fallback connection also failed: {fallback_error}")
            print("⚠️ Pastikan XAMPP MySQL sudah berjalan dan database 'optipredict_database' sudah dibuat")
            return None

def close_db_connection(conn, cursor=None):
    try:
        if cursor:
            cursor.close()
            print("✅ Cursor closed")
        if conn:
            conn.close()
            print("✅ Connection closed and returned to pool")
    except Exception as e:
        print(f"❌ Error closing connection: {e}")

def verify_user_exists(user_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if not conn:
            return False
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email FROM users WHERE id = %s", (user_id,))
        result = cursor.fetchone()
        return result if result else False
    except Exception as e:
        print(f"Error verifying user: {e}")
        return False
    finally:
        close_db_connection(conn, cursor)

def normalize_headers(df):
    def clean(col):
        return re.sub(r'\s+', '', str(col)).lower()
    df.columns = [clean(col) for col in df.columns]
    return df

def get_user_id_from_request(request):
    try:
        if hasattr(request, 'form') and request.form.get('userId'):
            return int(request.form.get('userId'))
        if hasattr(request, 'json') and request.json and request.json.get('userId'):
            return int(request.json.get('userId'))
        if hasattr(request, 'args') and request.args.get('userId'):
            return int(request.args.get('userId'))
        print("⚠️ No user_id found in request")
        return None
    except Exception as e:
        print(f"❌ Error extracting user_id: {e}")
        return None

def get_next_prediction_number(user_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if not conn:
            return 1
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COALESCE(MAX(prediction_number), 0) + 1 as next_number
            FROM predictions 
            WHERE user_id = %s
        """, (user_id,))
        result = cursor.fetchone()
        next_number = result[0] if result else 1
        print(f"📊 Next prediction number for user {user_id}: {next_number}")
        return next_number
    except Exception as e:
        print(f"❌ Error getting next prediction number: {e}")
        return 1
    finally:
        close_db_connection(conn, cursor)

@app.route('/predict-file', methods=['POST'])
def predict_file():
    try:
        ensure_model_and_scaler()
        start_total_time = time.time()
        print("📤 Received file upload request")
        user_id = get_user_id_from_request(request)
        print(f"📊 Processing file for user_id: {user_id}")
        if 'file' not in request.files:
            print("❌ No file in request")
            return jsonify({
                'success': False, 
                'message': 'File tidak ditemukan dalam request',
                'total_rows': 0,
                'processed_rows': 0,
                'results': []
            }), 400
        file = request.files['file']
        filename = file.filename.lower()
        original_filename = file.filename
        print(f"📊 Processing file: {original_filename}")
        try:
            read_start = time.time()
            if filename.endswith('.csv'):
                df = pd.read_csv(file)
            elif filename.endswith('.xlsx'):
                df = pd.read_excel(file, engine='openpyxl')
            elif filename.endswith('.xls'):
                df = pd.read_excel(file, engine='xlrd')
            else:
                error_msg = 'Format file tidak didukung (hanya .csv, .xlsx, .xls)'
                return jsonify({
                    'success': False, 
                    'message': error_msg,
                    'total_rows': 0,
                    'processed_rows': 0,
                    'results': []
                }), 400
            read_time = time.time() - read_start
            print(f"📊 File read completed in {read_time:.2f} seconds")
        except Exception as read_error:
            error_msg = f'Error membaca file: {str(read_error)}'
            print(f"❌ {error_msg}")
            return jsonify({
                'success': False, 
                'message': error_msg,
                'total_rows': 0,
                'processed_rows': 0,
                'results': []
            }), 400
        print(f"📊 Header asli: {list(df.columns)}")
        df = normalize_headers(df)
        print(f"📊 Header setelah normalisasi: {list(df.columns)}")
        required_columns = ['snr'] + [f'p{i}' for i in range(1, 31)]
        missing_cols = [col for col in required_columns if col not in df.columns]
        if missing_cols:
            error_msg = f'Kolom berikut wajib ada: {missing_cols}'
            print(f"❌ {error_msg}")
            return jsonify({
                'success': False, 
                'message': error_msg,
                'available_columns': list(df.columns),
                'total_rows': len(df),
                'processed_rows': 0,
                'results': []
            }), 400
        df_filtered = df[required_columns].copy()
        print(f"📊 Jumlah baris data: {len(df_filtered)}")
        preprocess_start = time.time()
        df_filtered = df_filtered.apply(pd.to_numeric, errors='coerce').fillna(0)
        snr_values = df_filtered['snr'].values
        input_columns = [f'p{i}' for i in range(1, 31)]
        inputs_matrix = df_filtered[input_columns].values
        preprocess_time = time.time() - preprocess_start
        print(f"📊 Data preprocessing completed in {preprocess_time:.2f} seconds")
        prediction_start = time.time()
        predictions, confidences, snr_normalized = predict_batch_optimized(
            model, snr_scaler, snr_values, inputs_matrix
        )
        if predictions is None:
            return jsonify({
                'success': False,
                'message': 'Error during batch prediction',
                'total_rows': len(df_filtered),
                'processed_rows': 0,
                'results': []
            }), 500
        prediction_time = time.time() - prediction_start
        print(f"📊 Batch prediction completed in {prediction_time:.2f} seconds")
        format_start = time.time()
        results = []
        for idx in range(len(predictions)):
            results.append({
                'row': idx + 1,
                'prediction': predictions[idx],
                'confidence': round(float(confidences[idx]), 2),
                'snr_raw': float(snr_values[idx]),
                'snr_normalized': round(float(snr_normalized[idx]), 4)
            })
        format_time = time.time() - format_start
        print(f"📊 Results formatting completed in {format_time:.2f} seconds")
        db_start = time.time()
        if user_id:
            try:
                next_prediction_number = get_next_prediction_number(user_id)
                predictions_data = []
                for idx in range(len(predictions)):
                    quality_assessment = 'High' if confidences[idx] > 80 else 'Medium' if confidences[idx] > 60 else 'Low'
                    predictions_data.append((
                        user_id,
                        next_prediction_number + idx,
                        float(snr_values[idx]),
                        float(snr_normalized[idx]),
                        json.dumps(inputs_matrix[idx].tolist()),
                        str(predictions[idx]),
                        float(confidences[idx]),
                        quality_assessment,
                        'Excel File',
                        '2.0',
                        datetime.now()
                    ))
                batch_insert_success = batch_insert_predictions(user_id, predictions_data)
                if batch_insert_success:
                    print(f"✅ Successfully saved {len(predictions_data)} predictions to database")
                else:
                    print("⚠️ Database insertion failed, but predictions completed")
            except Exception as db_error:
                print(f"❌ Database error (non-critical): {db_error}")
        db_time = time.time() - db_start
        print(f"📊 Database operations completed in {db_time:.2f} seconds")
        total_time = time.time() - start_total_time
        response_data = {
            'success': True,
            'message': f'Berhasil memproses {len(results)} baris data dari file {original_filename} dalam {total_time:.2f} detik',
            'total_rows': len(df_filtered),
            'processed_rows': len(results),
            'valid_rows': len(results),
            'error_rows': 0,
            'user_id': user_id,
            'processing_time': {
                'total': round(total_time, 2),
                'file_read': round(read_time, 2),
                'preprocessing': round(preprocess_time, 2),
                'prediction': round(prediction_time, 2),
                'formatting': round(format_time, 2),
                'database': round(db_time, 2)
            },
            'results': results
        }
        print(f"✅ Successfully processed {len(results)} rows for user {user_id} in {total_time:.2f} seconds")
        return jsonify(response_data), 200
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error dalam predict_file: {error_msg}")
        traceback.print_exc()
        return jsonify({
            'success': False, 
            'message': error_msg,
            'total_rows': 0,
            'processed_rows': 0,
            'results': []
        }), 500

@app.route('/predict', methods=['POST'])
def predict():
    conn = None
    cursor = None
    try:
        ensure_model_and_scaler()
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Data JSON tidak ditemukan'}), 400
        user_id = data.get('userId')
        snr_raw = float(data.get('snr', 0))
        inputs = data.get('inputs', [])
        input_type = data.get('inputType', 'Manual')
        print(f"📊 Received prediction request for user: {user_id}")
        if len(inputs) != 30:
            return jsonify({'success': False, 'message': 'Input harus berisi 30 parameter'}), 400
        if user_id:
            user_info = verify_user_exists(user_id)
            if not user_info:
                return jsonify({'success': False, 'message': 'User tidak ditemukan'}), 404
        snr_array = np.array([[snr_raw]], dtype=np.float32)
        snr_normalized = snr_scaler.transform(snr_array)[0][0]
        features = np.array([[snr_normalized] + inputs], dtype=np.float32)
        probabilities = model.predict_proba(features)
        predicted_class = np.argmax(probabilities[0])
        confidence = probabilities[0][predicted_class] * 100
        prediction_label = PREDICTION_LABELS.get(predicted_class, "Unknown")
        prediction_id = None
        prediction_number = None
        database_status = "not_saved"
        if user_id:
            try:
                prediction_number = get_next_prediction_number(user_id)
                conn = get_db_connection()
                if conn:
                    cursor = conn.cursor()
                    quality_assessment = 'High' if confidence > 80 else 'Medium' if confidence > 60 else 'Low'
                    cursor.execute("""
                        INSERT INTO predictions (
                            user_id, prediction_number, snr, snr_normalized, inputs, 
                            prediction, confidence, quality_assessment, input_type, 
                            model_version, created_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        user_id, 
                        prediction_number,
                        float(snr_raw), 
                        float(snr_normalized),
                        json.dumps(inputs),
                        str(prediction_label), 
                        float(confidence),
                        quality_assessment,
                        input_type,
                        '2.0',
                        datetime.now()
                    ))
                    prediction_id = cursor.lastrowid
                    conn.commit()
                    database_status = "saved"
            except Exception as db_error:
                print(f"❌ Database error: {db_error}")
                database_status = f"error: {str(db_error)}"
            finally:
                close_db_connection(conn, cursor)
        formatted_parameters = {}
        for i in range(30):
            param_key = f'P{i+1}'
            formatted_parameters[param_key] = float(inputs[i]) if i < len(inputs) else 0.0
        return jsonify({
            'success': True,
            'data': {
                'id': prediction_id,
                'prediction_number': prediction_number,
                'prediction': prediction_label,
                'confidence': round(float(confidence), 2),
                'snr_info': {
                    'raw': float(snr_raw),
                    'normalized': round(float(snr_normalized), 4)
                },
                'parameters': formatted_parameters,
                'timestamp': datetime.now().isoformat(),
                'user_id': user_id,
                'quality_assessment': 'High' if confidence > 80 else 'Medium' if confidence > 60 else 'Low',
                'input_type': input_type,
                'model_info': {
                    'model_type': 'CatBoost',
                    'version': '2.0'
                },
                'processing_time': '< 1s',
                'database_status': database_status
            },
            'message': 'Prediksi berhasil'
        })
    except Exception as e:
        print(f"❌ Error dalam predict: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        close_db_connection(conn, cursor)

@app.route('/predictions/<int:user_id>', methods=['GET'])
def get_history(user_id):
    conn = None
    cursor = None
    try:
        print(f"📊 Getting history for user ID: {user_id}")
        if not user_id or user_id <= 0:
            return jsonify({
                'success': False, 
                'message': 'Invalid user ID'
            }), 400
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False, 
                'message': 'Database connection failed'
            }), 500
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                id, prediction_number, snr, snr_normalized, inputs,
                prediction, confidence, quality_assessment, input_type,
                model_version, created_at
            FROM predictions 
            WHERE user_id = %s 
            ORDER BY created_at DESC 
            LIMIT 100
        """, (user_id,))
        results = cursor.fetchall()
        print(f"📊 Found {len(results)} predictions for user {user_id}")
        formatted_results = []
        for result in results:
            try:
                inputs_data = []
                if result['inputs']:
                    try:
                        inputs_data = json.loads(result['inputs'])
                        if not isinstance(inputs_data, list):
                            inputs_data = []
                    except json.JSONDecodeError:
                        inputs_data = []
                parameters = {}
                for i in range(30):
                    param_key = f'P{i+1}'
                    if i < len(inputs_data):
                        try:
                            parameters[param_key] = float(inputs_data[i])
                        except (ValueError, TypeError):
                            parameters[param_key] = 0.0
                    else:
                        parameters[param_key] = 0.0
                formatted_result = {
                    'id': result['id'],
                    'prediction_number': result['prediction_number'] or result['id'],
                    'prediction': result['prediction'] or 'N/A',
                    'confidence': float(result['confidence']) if result['confidence'] else 0.0,
                    'snr': float(result['snr']) if result['snr'] else 0.0,
                    'snr_normalized': float(result['snr_normalized']) if result['snr_normalized'] else 0.0,
                    'parameters': parameters,
                    'quality_assessment': result['quality_assessment'] or 'N/A',
                    'input_type': result['input_type'] or 'Manual',
                    'model_version': result['model_version'] or '2.0',
                    'created_at': result['created_at'].isoformat() if result['created_at'] else None
                }
                formatted_results.append(formatted_result)
            except Exception as format_error:
                print(f"❌ Error formatting result {result.get('id', 'unknown')}: {format_error}")
                continue
        return jsonify({
            'success': True,
            'data': formatted_results,
            'total_count': len(formatted_results),
            'user_id': user_id,
            'message': f'Found {len(formatted_results)} predictions'
        }), 200
    except Exception as e:
        print(f"❌ Error getting history for user {user_id}: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False, 
            'message': f'Error retrieving history: {str(e)}'
        }), 500
    finally:
        close_db_connection(conn, cursor)

@app.route('/history/<int:user_id>', methods=['GET'])
def get_user_history(user_id):
    return get_history(user_id)

@app.route('/predictions/count/<int:user_id>', methods=['GET'])
def get_predictions_count(user_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM predictions WHERE user_id = %s", (user_id,))
        count_result = cursor.fetchone()
        count = count_result[0] if count_result else 0
        return jsonify({
            'success': True,
            'count': count,
            'user_id': user_id,
            'has_data': count > 0
        }), 200
    except Exception as e:
        print(f"❌ Error getting count for user {user_id}: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        close_db_connection(conn, cursor)

@app.route('/predictions/all/<int:user_id>', methods=['DELETE'])
def delete_all_predictions(user_id):
    conn = None
    cursor = None
    try:
        print(f"🗑️ Deleting all predictions for user: {user_id}")
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Koneksi database gagal'}), 500
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM predictions WHERE user_id = %s", (user_id,))
        count_result = cursor.fetchone()
        deleted_count = count_result[0] if count_result else 0
        cursor.execute("DELETE FROM predictions WHERE user_id = %s", (user_id,))
        conn.commit()
        print(f"✅ Deleted {deleted_count} predictions for user {user_id}")
        return jsonify({
            'success': True,
            'message': f'Berhasil menghapus {deleted_count} prediksi.',
            'deleted_count': deleted_count
        }), 200
    except Exception as e:
        print(f"❌ Error deleting all predictions for user {user_id}: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        close_db_connection(conn, cursor)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'success': True,
        'status': 'healthy',
        'model_loaded': model is not None,
        'scaler_loaded': snr_scaler is not None,
        'database': 'XAMPP MySQL',
        'optimization': 'Batch Processing Enabled',
        'endpoints': [
            '/predict-file (POST)',
            '/predict (POST)', 
            '/predictions/<user_id> (GET)',
            '/history/<user_id> (GET)',
            '/predictions/count/<user_id> (GET)',
            '/predictions/all/<user_id> (DELETE)',
            '/health (GET)'
        ],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/test-db', methods=['GET'])
def test_database():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Failed to connect to database'
            }), 500
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        cursor.execute("SHOW TABLES LIKE 'predictions'")
        table_exists = cursor.fetchone()
        cursor.execute("SHOW TABLES LIKE 'users'")
        users_table_exists = cursor.fetchone()
        return jsonify({
            'success': True,
            'message': 'Database connection successful',
            'database': 'optipredict_database',
            'tables': {
                'predictions': bool(table_exists),
                'users': bool(users_table_exists)
            },
            'test_query': bool(result)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Database test failed: {str(e)}'
        }), 500
    finally:
        close_db_connection(conn, cursor)

if __name__ == '__main__':
    print("🚀 Starting OPTIMIZED Flask ML Service with HISTORY ENDPOINTS...")
    pool_initialized = init_connection_pool()
    if not pool_initialized:
        print("❌ Warning: Connection pool initialization failed")
    model_loaded = load_model_and_scaler()
    if model_loaded:
        print("✅ Model dan scaler siap digunakan")
    else:
        print("❌ Model atau scaler gagal dimuat")
    print("📡 OPTIMIZED Server akan berjalan di: http://localhost:5001")
    print("🚀 OPTIMIZATIONS ENABLED:")
    print("   - Vectorized batch predictions")
    print("   - Optimized database batch inserts")
    print("   - Memory-efficient data processing")
    print("   - Performance monitoring")
    print("📊 Expected performance: 125K rows in <5 minutes")
    print("📋 Available endpoints:")
    print("   - POST /predict-file (batch prediction)")
    print("   - POST /predict (single prediction)")
    print("   - GET /predictions/<user_id> (history)")
    print("   - GET /history/<user_id> (alternative history)")
    print("   - GET /predictions/count/<user_id> (count)")
    print("   - DELETE /predictions/all/<user_id> (delete all)")
    print("   - GET /health (health check)")
    print("   - GET /test-db (database test)")
    app.run(debug=True, host='0.0.0.0', port=5001, threaded=True)
