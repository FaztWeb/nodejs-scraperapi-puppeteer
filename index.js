import fs from 'fs/promises'
import puppeteer from 'puppeteer'
import xlsx from 'xlsx'

const API_KEY = process.env.SCRAPER_API_KEY;
const URL = "https://www.amazon.com/-/es/Laptops/b?ie=UTF8&node=565108";

async function main() {
    const response = await fetch(`http://api.scraperapi.com/?api_key=${API_KEY}&url=${URL}&render=true`)
    const data = await response.text();
    // await fs.writeFile('output.html', data);
    // console.log(data);

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    await page.setContent(data)

    const productsData = await page.evaluate(() => {
        const productsElements = document.querySelectorAll('div.a-section.octopus-pc-asin-info-section')
        
        console.log(productsElements)
        const productsData = []

        productsElements.forEach(productElement => {
            const priceWhole = productElement.querySelector('.a-price-whole');
            const priceDecimal = productElement.querySelector('.a-price-fraction')
            const price = `${priceWhole.textContent}${priceDecimal.textContent}`
            const titleElement = productElement.querySelector('.a-section.octopus-pc-asin-title')

            console.log(price, titleElement.textContent)

            productsData.push({
                price: price,
                description: titleElement.textContent.trim() // 'asasd'
            })
        })

        return productsData
    })

    console.log(productsData)

    // write in csv
    let csv = 'Description,Price\n'
    productsData.forEach(product => {
        csv += `${product.description},${product.price}\n`
    })
    await fs.writeFile('products.csv', csv)

    // write in xlsx
    const ws = xlsx.utils.json_to_sheet(productsData)
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'Products')

    await fs.writeFile('products.xlsx', xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' }))


    await browser.close()
}

main()

