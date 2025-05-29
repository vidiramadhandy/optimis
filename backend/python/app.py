# python/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import numpy as np
from catboost import CatBoostClassifier
import os
import json
from datetime import datetime
import traceback

app = Flask(__name__)
CORS(app)

# Konfigurasi Database
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'optipredict_database'
}

# Load model CBM
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'catboost_model.cbm')
model = None

def load_model():
    global model
    try:
        if os.path.exists(MODEL_PATH):
            model = CatBoostClassifier()
            model.load_model(MODEL_PATH)
            print(f"✅ Model CBM berhasil dimuat dari: {MODEL_PATH}")
            
            # Verifikasi detail model CBM
            print(f"🔍 Model CBM Verification:")
            print(f"   - Model Type: {type(model).__name__}")
            print(f"   - Is CatBoost: {isinstance(model, CatBoostClassifier)}")
            print(f"   - Tree Count: {getattr(model, 'tree_count_', 'Unknown')}")
            print(f"   - Feature Count: {getattr(model, 'feature_count_', 'Unknown')}")
            print(f"   - Classes: {getattr(model, 'classes_', []).tolist() if hasattr(model, 'classes_') else 'Unknown'}")
            
            # Test model dengan data dummy
            test_features = np.array([[5.0] * 30 + [15.0]])
            test_prediction = model.predict(test_features)
            test_proba = model.predict_proba(test_features)
            
            print(f"✅ Model CBM test berhasil:")
            print(f"   - Test Prediction: {test_prediction[0]}")
            print(f"   - Test Probabilities shape: {test_proba.shape}")
            print(f"   - Test Confidence: {max(test_proba[0]):.4f}")
            
            # Test staged prediction (fitur khusus CatBoost)
            try:
                staged_pred = list(model.staged_predict(test_features))
                print(f"   - Staged Predictions Available: {len(staged_pred)} stages")
            except Exception as staged_error:
                print(f"   - Staged Predictions: Not available ({staged_error})")
            
            return True
        else:
            print(f"❌ File model tidak ditemukan: {MODEL_PATH}")
            print(f"📁 Isi direktori: {os.listdir(os.path.dirname(__file__))}")
            return False
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        traceback.print_exc()
        return False

def get_db_connection():
    try:
        return mysql.connector.connect(**DB_CONFIG)
    except Exception as e:
        print(f"Error koneksi database: {e}")
        return None

def verify_user_exists(user_id):
    """Verifikasi user exists di database"""
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
            print(f"✅ User verified: ID {result[0]}, Name: {result[1]}")
            return result
        else:
            print(f"❌ User dengan ID {user_id} tidak ditemukan")
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
        'model_type': type(model).__name__ if model else None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/test-model-detailed', methods=['GET'])
def test_model_detailed():
    """Test model CBM dengan detail lengkap"""
    try:
        if model is None:
            return jsonify({
                'success': False,
                'message': 'Model CBM tidak ter-load',
                'model_path': MODEL_PATH,
                'file_exists': os.path.exists(MODEL_PATH)
            })
        
        # Test dengan data dummy
        test_features = np.array([[5.0] * 30 + [15.0]])  # 30 P values + 1 SNR
        
        # Informasi detail model
        model_details = {
            'model_type': type(model).__name__,
            'model_class': str(model.__class__),
            'is_catboost': isinstance(model, CatBoostClassifier),
            'tree_count': getattr(model, 'tree_count_', 'Unknown'),
            'feature_count': getattr(model, 'feature_count_', 'Unknown'),
            'classes': getattr(model, 'classes_', []).tolist() if hasattr(model, 'classes_') else None,
            'model_file_path': MODEL_PATH,
            'model_exists': os.path.exists(MODEL_PATH)
        }
        
        # Test prediksi
        prediction = model.predict(test_features)[0]
        probabilities = model.predict_proba(test_features)[0]
        confidence = float(max(probabilities))
        
        # Test dengan staged prediction (fitur khusus CatBoost)
        try:
            staged_predictions = list(model.staged_predict(test_features))
            staged_count = len(staged_predictions)
        except:
            staged_predictions = None
            staged_count = 0
        
        return jsonify({
            'success': True,
            'message': 'Model CBM test berhasil',
            'model_details': model_details,
            'test_results': {
                'test_prediction': str(prediction),
                'test_confidence': confidence,
                'test_probabilities': probabilities.tolist(),
                'staged_predictions_count': staged_count,
                'staged_predictions_sample': staged_predictions[-5:] if staged_predictions else None
            },
            'verification': {
                'is_catboost_model': isinstance(model, CatBoostClassifier),
                'has_predict_method': hasattr(model, 'predict'),
                'has_predict_proba_method': hasattr(model, 'predict_proba'),
                'has_staged_predict': hasattr(model, 'staged_predict')
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error testing model CBM: {str(e)}',
            'error_details': str(e)
        })

@app.route('/predict', methods=['POST'])
def predict():
    """Endpoint prediksi ML - menerima data dari Express yang sudah terautentikasi"""
    try:
        data = request.get_json()
        
        inputs = data.get('inputs', [])
        snr = data.get('snr')
        user_id = data.get('userId')
        input_type = data.get('inputType', 'Manual').lower()
        
        print(f"🔍 ML Prediction Request:")
        print(f"   - User ID: {user_id}")
        print(f"   - Inputs length: {len(inputs)}")
        print(f"   - SNR: {snr}")
        print(f"   - Input type: {input_type}")
        
        # Validasi input
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'User ID tidak ditemukan'
            }), 400
        
        if len(inputs) != 30 or snr is None:
            return jsonify({
                'success': False,
                'message': 'Input tidak valid - diperlukan 30 parameter dan SNR'
            }), 400
        
        # Konversi ke float
        try:
            inputs_float = [float(x) for x in inputs]
            snr_float = float(snr)
        except ValueError as ve:
            return jsonify({
                'success': False,
                'message': f'Error konversi data: {str(ve)}'
            }), 400
        
        # Validasi range
        if any(x < 0 or x > 10 for x in inputs_float) or snr_float < 0 or snr_float > 30:
            return jsonify({
                'success': False,
                'message': 'Input P1-P30 harus antara 0-10 dan SNR antara 0-30'
            }), 400
        
        # Verifikasi user exists
        user_data = verify_user_exists(user_id)
        if not user_data:
            return jsonify({
                'success': False,
                'message': f'User dengan ID {user_id} tidak ditemukan'
            }), 404
        
        # Validasi model tersedia
        if model is None:
            return jsonify({
                'success': False,
                'message': 'Model CBM tidak tersedia'
            }), 500
        
        # PREDIKSI DENGAN MODEL CBM - DENGAN VERIFIKASI DETAIL
        print(f"🤖 Memulai prediksi CBM untuk user: {user_data[1]}")
        
        try:
            features = inputs_float + [snr_float]
            features_array = np.array([features])
            
            # Informasi model untuk verifikasi
            model_info = {
                'model_type': type(model).__name__,
                'is_catboost': isinstance(model, CatBoostClassifier),
                'prediction_method': 'model.predict()',
                'probability_method': 'model.predict_proba()',
                'feature_count': len(features),
                'tree_count': getattr(model, 'tree_count_', 'Unknown'),
                'model_classes': getattr(model, 'classes_', []).tolist() if hasattr(model, 'classes_') else None
            }
            
            print(f"🔍 Model CBM Details:")
            print(f"   - Model type: {model_info['model_type']}")
            print(f"   - Is CatBoost: {model_info['is_catboost']}")
            print(f"   - Tree Count: {model_info['tree_count']}")
            print(f"   - Features shape: {features_array.shape}")
            print(f"   - Features data: {features_array[0]}")
            
            # Lakukan prediksi dengan model CBM
            prediction = model.predict(features_array)[0]
            probabilities = model.predict_proba(features_array)[0]
            confidence = float(max(probabilities))
            
            print(f"✅ PREDIKSI CBM BERHASIL!")
            print(f"   - Model Type: {model_info['model_type']}")
            print(f"   - Tree Count: {model_info['tree_count']}")
            print(f"   - Prediction: {prediction}")
            print(f"   - Confidence: {confidence:.4f} ({confidence:.2%})")
            print(f"   - Probabilities: {probabilities}")
            print(f"   - Model Classes: {model_info['model_classes']}")
            
        except Exception as pred_error:
            print(f"❌ ERROR PREDIKSI CBM: {pred_error}")
            traceback.print_exc()
            return jsonify({
                'success': False,
                'message': f'Error prediksi model CBM: {str(pred_error)}'
            }), 500
        
        # Simpan ke database
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Gagal koneksi database'
            }), 500
        
        try:
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
            cursor.execute(manual_query, [user_id] + inputs_float + [snr_float])
            manual_input_id = cursor.lastrowid
            
            print(f"💾 Data tersimpan di manual_inputs ID: {manual_input_id}")
            
            # Simpan prediksi dengan informasi model
            prediction_query = """
            INSERT INTO fiber_predictions (
                user_id, input_type, manual_input_id, prediction_result, 
                confidence_score, quality_assessment, model_version
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            
            quality = 'excellent' if confidence >= 0.9 else 'good' if confidence >= 0.7 else 'fair' if confidence >= 0.5 else 'poor'
            
            prediction_result_json = {
                'prediction': str(prediction),
                'raw_prediction': float(prediction) if isinstance(prediction, (int, float, np.number)) else str(prediction),
                'user_name': user_data[1],
                'model_info': model_info  # Tambahkan info model untuk verifikasi
            }
            
            cursor.execute(prediction_query, (
                user_id, input_type, manual_input_id, 
                json.dumps(prediction_result_json),
                confidence, quality, f'CBM-{model_info["tree_count"]}'
            ))
            
            prediction_id = cursor.lastrowid
            conn.commit()
            cursor.close()
            conn.close()
            
            print(f"💾 Prediksi tersimpan di fiber_predictions ID: {prediction_id}")
            
            return jsonify({
                'success': True,
                'data': {
                    'id': prediction_id,
                    'prediction': str(prediction),
                    'confidence': confidence,
                    'quality_assessment': quality,
                    'probabilities': probabilities.tolist(),
                    'timestamp': datetime.now().isoformat(),
                    'user_id': user_id,
                    'manual_input_id': manual_input_id,
                    'model_info': model_info,  # Informasi model untuk verifikasi
                    'user_info': {
                        'id': user_data[0],
                        'name': user_data[1],
                        'email': user_data[2]
                    }
                },
                'message': f'Prediksi CBM berhasil untuk {user_data[1]}! Model: {model_info["model_type"]} dengan {model_info["tree_count"]} trees'
            })
            
        except Exception as db_error:
            print(f"❌ Error database: {db_error}")
            if conn:
                conn.rollback()
                cursor.close()
                conn.close()
            return jsonify({
                'success': False,
                'message': f'Error menyimpan ke database: {str(db_error)}'
            }), 500
            
    except Exception as e:
        print(f"❌ Error umum: {e}")
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
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Gagal koneksi database'})
        
        cursor = conn.cursor(dictionary=True)
        
        # Query untuk join data prediksi dengan manual_inputs
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
            return jsonify({
                'success': False,
                'message': 'Data prediksi tidak ditemukan'
            }), 404
        
        # Parse JSON fields
        if result['prediction_result']:
            result['prediction_result'] = json.loads(result['prediction_result'])
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': result,
            'message': 'Data prediksi berhasil diambil'
        })
        
    except Exception as e:
        print(f"Error getting prediction detail: {e}")
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        })

@app.route('/predictions/<int:user_id>', methods=['GET'])
def get_user_predictions(user_id):
    """Get predictions history untuk user tertentu"""
    try:
        limit = request.args.get('limit', 10, type=int)
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Gagal koneksi database'})
        
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT fp.*, mi.p1, mi.p2, mi.p3, mi.p4, mi.p5, mi.snr, mi.created_at as input_created
        FROM fiber_predictions fp
        JOIN manual_inputs mi ON fp.manual_input_id = mi.id
        WHERE fp.user_id = %s
        ORDER BY fp.created_at DESC
        LIMIT %s
        """
        
        cursor.execute(query, (user_id, limit))
        results = cursor.fetchall()
        
        # Parse JSON fields
        for result in results:
            if result['prediction_result']:
                result['prediction_result'] = json.loads(result['prediction_result'])
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': results,
            'count': len(results)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        })

# TAMBAHAN: Endpoint untuk delete prediksi
@app.route('/prediction/<int:prediction_id>', methods=['DELETE'])
def delete_prediction(prediction_id):
    """Hapus prediksi berdasarkan ID"""
    try:
        user_id = request.args.get('userId')
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'User ID diperlukan'
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Gagal koneksi database'})
        
        cursor = conn.cursor()
        
        # Cek apakah prediksi milik user yang sedang login
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
        
        # Hapus dari fiber_predictions terlebih dahulu (karena foreign key)
        cursor.execute("DELETE FROM fiber_predictions WHERE id = %s", (prediction_id,))
        
        # Hapus dari manual_inputs
        if manual_input_id:
            cursor.execute("DELETE FROM manual_inputs WHERE id = %s", (manual_input_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Prediksi ID {prediction_id} berhasil dihapus")
        
        return jsonify({
            'success': True,
            'message': 'Prediksi berhasil dihapus'
        })
        
    except Exception as e:
        print(f"Error deleting prediction: {e}")
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/predictions/all/<int:user_id>', methods=['DELETE'])
def delete_all_predictions(user_id):
    """Hapus semua prediksi user"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Gagal koneksi database'})
        
        cursor = conn.cursor()
        
        # Ambil semua manual_input_id yang akan dihapus
        cursor.execute("SELECT manual_input_id FROM fiber_predictions WHERE user_id = %s", (user_id,))
        manual_input_ids = cursor.fetchall()
        
        # Hapus semua fiber_predictions user
        cursor.execute("DELETE FROM fiber_predictions WHERE user_id = %s", (user_id,))
        deleted_predictions = cursor.rowcount
        
        # Hapus semua manual_inputs terkait
        if manual_input_ids:
            manual_ids = [row[0] for row in manual_input_ids if row[0]]
            if manual_ids:
                format_strings = ','.join(['%s'] * len(manual_ids))
                cursor.execute(f"DELETE FROM manual_inputs WHERE id IN ({format_strings})", manual_ids)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Semua prediksi user {user_id} berhasil dihapus ({deleted_predictions} records)")
        
        return jsonify({
            'success': True,
            'message': f'Berhasil menghapus {deleted_predictions} prediksi',
            'deleted_count': deleted_predictions
        })
        
    except Exception as e:
        print(f"Error deleting all predictions: {e}")
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Flask ML Service...")
    print("🔧 Flask hanya menangani ML predictions")
    print("🔐 Autentikasi ditangani oleh Express backend")
    print("=" * 50)
    
    # Load model saat startup
    model_loaded = load_model()
    if model_loaded:
        print("✅ Model CBM siap digunakan")
    else:
        print("❌ Model CBM gagal dimuat - service tetap berjalan")
    
    print("=" * 50)
    print("🌐 Flask ML service running on http://0.0.0.0:5001")
    print("📋 Endpoints tersedia:")
    print("   - GET  /health")
    print("   - GET  /test-model-detailed")
    print("   - POST /predict")
    print("   - GET  /prediction/<id>")
    print("   - DELETE /prediction/<id>")
    print("   - GET  /predictions/<user_id>")
    print("   - DELETE /predictions/all/<user_id>")
    
    app.run(debug=True, host='0.0.0.0', port=5001)
