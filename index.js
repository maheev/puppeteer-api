const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send({ error: 'Missing URL' });

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Переход на нужную страницу
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Ждём появления карточек товаров
    await page.waitForSelector('.product-card');

    // Забираем данные
    const data = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.product-card')).map(el => {
        const title = el.querySelector('.product-card-name')?.innerText.trim() || 'Нет названия';

        // Извлекаем цену
        const rub = el.querySelector('.product-price__sum-rubles')?.innerText.trim() || '';
        const kop = el.querySelector('.product-price__sum-penny')?.innerText.trim() || '';
        const price = rub ? `${rub}.${kop || '00'}` : 'Нет цены';

        // Добавляем бренд (по первому слову) и сеть
        const brand = title.split(' ')[0].toUpperCase();
        const network = "METRO";

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
