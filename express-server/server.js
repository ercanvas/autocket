const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// IMPORTANT: Use deployed Flask API in production
const flaskApiUrl = process.env.FLASK_API_URL || 'https://autocket-flask.onrender.com';

app.use(cors({
  origin: [
    'http://localhost:3001',
    'https://autocket.vercel.app'
  ]
}));
app.use(bodyParser.json());

let lastPrice = null;

// POST: Kullanıcıdan araç bilgilerini al, Python Flask'a yolla, fiyatı kaydet
app.post('/tahmin', async (req, res) => {
    try {
        // Sadece modelin bildiği alanları bırak
        const allowed = [
            'marka','seri','model','yıl','yakıt','vites','araç_durumu','km','kasa_tipi','motor_gucu','motor_hacmi','cekis','renk','garanti','agir_hasarlı'
        ];
        const carData = {};
        for (const k of allowed) {
            carData[k] = req.body[k];
        }
        const response = await axios.post(`${flaskApiUrl}/predict`, carData);
        lastPrice = response.data.fiyat;
        res.json({ fiyat: lastPrice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.response?.data?.error || error.message });
    }
});

// Yardımcı: ASCII'den Türkçe'ye çevir
function decodeParam(value, map) {
    if (!map) return value;
    return map[value] || value;
}

const valueMaps = {
    yakit: { Benzin: 'Benzin', Dizel: 'Dizel', Elektrik: 'Elektrik', LPG: 'LPG' },
    vites: { Otomatik: 'Otomatik', Manuel: 'Manuel' },
    arac_durumu: { Sifir: 'Sıfır', IkinciEl: 'İkinci El' },
    kasa_tipi: { Sedan: 'Sedan', Hatchback: 'Hatchback', SUV: 'SUV', Coupe: 'Coupe' },
    cekis: { OndenCekis: 'Önden Çekiş', ArkadanItis: 'Arkadan İtiş', DörtX4: '4x4' },
    garanti: { Var: 'Var', Yok: 'Yok' },
    agir_hasarlı: { Hayir: 'Hayır', Evet: 'Evet' }
};

// GET: ASCII URL ile tahmin
app.get('/tahmin/:marka/:seri/:model/:yil/:yakit/:vites/:arac_durumu/:km/:kasa_tipi/:motor_gucu/:motor_hacmi/:cekis/:renk/:garanti/:agir_hasarlı', async (req, res) => {
    const params = req.params;
    const carData = {
        marka: params.marka,
        seri: params.seri,
        model: params.model,
        yıl: Number(params.yil),
        yakıt: decodeParam(params.yakit, valueMaps.yakit),
        vites: decodeParam(params.vites, valueMaps.vites),
        araç_durumu: decodeParam(params.arac_durumu, valueMaps.arac_durumu),
        km: Number(params.km),
        kasa_tipi: decodeParam(params.kasa_tipi, valueMaps.kasa_tipi),
        motor_gucu: Number(params.motor_gucu),
        motor_hacmi: Number(params.motor_hacmi),
        cekis: decodeParam(params.cekis, valueMaps.cekis),
        renk: params.renk,
        garanti: decodeParam(params.garanti, valueMaps.garanti),
        agir_hasarlı: decodeParam(params.agir_hasarlı, valueMaps.agir_hasarlı)
    };
    try {
        const response = await axios.post(`${flaskApiUrl}/predict`, carData);
        res.json({ fiyat: response.data.fiyat });
    } catch (error) {
        res.status(500).json({ error: error.response?.data?.error || error.message });
    }
});

// GET: Son tahmini fiyatı döndür
app.get('/tahmin', (req, res) => {
    if (lastPrice === null) {
        return res.status(404).json({ error: 'Henüz bir tahmin yapılmadı.' });
    }
    res.json({ fiyat: lastPrice });
});

// POST: Kullanıcıdan araç bilgilerini ve fiyatı al, datas.csv'ye ekle
app.post('/insert-auto', (req, res) => {
    const car = req.body;
    // Sıra: marka,seri,model,yıl,yakıt,vites,araç_durumu,km,kasa_tipi,motor_gucu,motor_hacmi,cekis,renk,garanti,agir_hasarlı,fiyat
    const row = [
        car.marka,
        car.seri,
        car.model,
        car.yıl,
        car.yakıt,
        car.vites,
        car.araç_durumu,
        car.km,
        car.kasa_tipi,
        car.motor_gucu,
        car.motor_hacmi,
        car.cekis,
        car.renk,
        car.garanti,
        car.agir_hasarlı,
        car.fiyat
    ].join(',') + '\n';
    fs.appendFile('datas.csv', row, (err) => {
        if (err) return res.status(500).json({ error: 'CSV ekleme hatası' });
        res.json({ success: true });
    });
});

// GET: Tüm araçları oku ve JSON döndür (ilk 20 satır eğitim datası, sadece sonrakiler gösterilecek)
app.get('/vehicles', (req, res) => {
    fs.readFile('datas.csv', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'CSV okuma hatası' });
        const lines = data.trim().split('\n');
        const headers = lines[0].split(',');
        // İlk satır başlık, 1-20 arası eğitim datası, 21. satırdan itibaren eklenenler
        const vehicles = lines.slice(20).map(line => {
            const vals = line.split(',');
            const obj = {};
            headers.forEach((h, i) => obj[h] = vals[i]);
            return obj;
        });
        res.json(vehicles);
    });
});

// GET: Tek bir aracı oku
app.get('/vehicle/:id', (req, res) => {
    fs.readFile('datas.csv', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'CSV okuma hatası' });
        const lines = data.trim().split('\n');
        const headers = lines[0].split(',');
        const idx = parseInt(req.params.id, 10);
        if (isNaN(idx) || idx < 0 || idx >= lines.length - 1) {
            return res.status(404).json({ error: 'Araç bulunamadı' });
        }
        const vals = lines[idx + 1].split(',');
        const obj = {};
        headers.forEach((h, i) => obj[h] = vals[i]);
        res.json(obj);
    });
});

// DELETE: Belirli bir aracı CSV'den sil
app.delete('/vehicle/:id', (req, res) => {
    const idx = parseInt(req.params.id, 10);
    fs.readFile('datas.csv', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'CSV okuma hatası' });
        const lines = data.trim().split('\n');
        if (isNaN(idx) || idx <= 0 || idx >= lines.length) {
            return res.status(404).json({ error: 'Araç bulunamadı' });
        }
        lines.splice(idx, 1);
        fs.writeFile('datas.csv', lines.join('\n') + '\n', (err2) => {
            if (err2) return res.status(500).json({ error: 'CSV yazma hatası' });
            res.json({ success: true });
        });
    });
});

// PUT: Belirli bir aracı CSV'de güncelle
app.put('/vehicle/:id', (req, res) => {
    const idx = parseInt(req.params.id, 10);
    const car = req.body;
    fs.readFile('datas.csv', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'CSV okuma hatası' });
        const lines = data.trim().split('\n');
        if (isNaN(idx) || idx <= 0 || idx >= lines.length) {
            return res.status(404).json({ error: 'Araç bulunamadı' });
        }
        // Sıra: marka,seri,model,yıl,yakıt,vites,araç_durumu,km,kasa_tipi,motor_gucu,motor_hacmi,cekis,renk,garanti,agir_hasarlı,fiyat
        const row = [
            car.marka,
            car.seri,
            car.model,
            car.yıl,
            car.yakıt,
            car.vites,
            car.araç_durumu,
            car.km,
            car.kasa_tipi,
            car.motor_gucu,
            car.motor_hacmi,
            car.cekis,
            car.renk,
            car.garanti,
            car.agir_hasarlı,
            car.fiyat
        ].join(',');
        lines[idx] = row;
        fs.writeFile('datas.csv', lines.join('\n') + '\n', (err2) => {
            if (err2) return res.status(500).json({ error: 'CSV yazma hatası' });
            res.json({ success: true });
        });
    });
});

// 404 JSON fallback
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
    console.log(`Server çalışıyor: http://localhost:${port}`);
});
