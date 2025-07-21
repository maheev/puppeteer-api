const express = require('express');
const puppeteer = require('puppeteer-core');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send({ error: 'Missing URL' });

  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome', // ✅ надёжный путь
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.product-card');

    const data = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.product-card')).map(el => {
        const title = el.querySelector('.product-card-name')?.innerText.trim() || 'Нет названия';
        const rub = el.querySelector('.product-price__sum-rubles')?.innerText.trim() || '';
        const kop = el.querySelector('.product-price__sum-penny')?.innerText.trim() || '';
        const price = rub ? `${rub}.${kop || '00'}` : 'Нет цены';
        const brand = title.split(' ')[0].toUpperCase();
        const network = 'METRO';

        return { title, price, brand, network };
      });
    });

    await browser.close();
    res.json(data);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
