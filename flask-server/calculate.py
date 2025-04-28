import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.preprocessing import LabelEncoder
import os
import sys
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# CSV'den veriyi oku
df = pd.read_csv('datas.csv')

# Hedef değişken (fiyat)
y = df['fiyat']

# Özelliklerden hedef değişkeni çıkar
X = df.drop('fiyat', axis=1)

# Kategorik sütunları otomatik bul
categorical_cols = X.select_dtypes(include=['object']).columns

# Kategorik sütunları label encode et
le_dict = {}
for col in categorical_cols:
    le = LabelEncoder()
    X[col] = le.fit_transform(X[col].astype(str))
    le_dict[col] = le

# Veriyi eğitim ve test olarak ayır
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Modeli oluştur ve eğit
model = RandomForestRegressor(random_state=42)
model.fit(X_train, y_train)

# Test verisiyle tahmin yap
preds = model.predict(X_test)

# Hata hesapla
mae = mean_absolute_error(y_test, preds)
print(f'Ortalama mutlak hata: {mae:.0f} TL')

# Yeni bir örnekle tahmin yapmak için fonksiyon
def predict_price(example_dict):
    example = X.iloc[[0]].copy()
    for col in example_dict:
        if col in categorical_cols:
            le = le_dict[col]
            val = example_dict[col]
            if val in le.classes_:
                example[col] = le.transform([val])[0]
            else:
                # Bilinmeyen kategori: en sık görüleni ata
                example[col] = le.transform([le.classes_[0]])[0]
        else:
            example[col] = example_dict[col]
    return model.predict(example)[0]

# Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:3001", "https://autocket.vercel.app"])

@app.route('/predict', methods=['POST'])
def predict():
    car_dict = request.get_json()
    try:
        tahmini = predict_price(car_dict)
        return jsonify({'fiyat': int(tahmini)})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Örnek tahmin
yeni_arac = {
    'marka': 'Toyota',
    'seri': 'Corolla',
    'model': '1.6 Vision',
    'yıl': 2022,
    'yakıt': 'Benzin',
    'vites': 'Otomatik',
    'araç_durumu': 'Sıfır',
    'km': 0,
    'kasa_tipi': 'Sedan',
    'motor_gucu': 132,
    'motor_hacmi': 1598,
    'cekis': 'Önden Çekiş',
    'renk': 'Beyaz',
    'garanti': 'Var',
    'agir_hasarlı': 'Hayır'
}
tahmini_fiyat = predict_price(yeni_arac)
print(f'Yeni aracın tahmini fiyatı: {int(tahmini_fiyat)} TL')

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # JSON string olarak parametre al
        car_json = sys.argv[1]
        car_dict = json.loads(car_json)
        tahmini = predict_price(car_dict)
        print(int(tahmini))
        sys.exit(0)
    else:
        port = int(os.environ.get("PORT", 5000))
        app.run(host="0.0.0.0", port=port)