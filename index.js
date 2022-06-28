const config = require('./config/config')
const puppeteer = require('puppeteer-extra')
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha')
const chance = require('chance')({ nationality: config.nationality });

puppeteer.use(
    RecaptchaPlugin({
      provider: {
        id: '2captcha',
        token: 'token'
      },
      visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
    })
  )


generateDataset = (restaurantName) => {

    dataSet = [...Array(365)].map((_, i) => 
        new Date(Date.now() + i * 86400000)
    ).map((date, i) => {
        return {
            email: config.email.replace('0000000000@', `${Number(i).toString(2).padStart(10, '0').replace(/0/g, '0').replace(/1/g, '.0')}@`),
            birthdayDay: String(date.getDate()).padStart(2, '0'),
            birthdayMonth: String(date.getMonth() + 1).padStart(2, '0'),
            favoriteLocation: config.favoriteLocation,
        }
    })
    
    return dataSet
}

generateName = () => {
    return {
        first: chance.first({ gender: config.gender }),
        last: chance.last({ gender: config.gender })
    }
}



(async () => {

    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 250
    });

    dataSet = generateDataset(config.restaurant)


    if (config.restaurant == 'habit') {
        for (var i = 0; i < dataSet.length; i++) {
            data = dataSet[i]
            const page = await browser.newPage();
            await page.goto('https://www.habitburger.com/charclub/');
            await Promise.all([
                page.$eval('#input_6_10', (elem, firstName) => elem.value = firstName, generateName()['first']),
                page.$eval('#input_6_11', (elem, lastName) => elem.value = lastName, generateName()['last']),
                page.$eval('#input_6_2', (elem, email) => elem.value = email, data['email']),
                page.$eval('#input_6_6', (elem, zip) => elem.value = zip, config['zip']),
                page.$eval('#input_6_4', (elem, birthdayMonth) => elem.value = birthdayMonth, data['birthdayMonth']),
                page.$eval('#input_6_5', (elem, birthdayDay) => elem.value = birthdayDay, data['birthdayDay']),
                page.$eval('#input_6_3', (elem, favoriteLocation) => elem.value = favoriteLocation, data['favoriteLocation']),
                page.solveRecaptchas()
            ])
            await page.click('#gform_submit_button_6', {waitUntil: 'domcontentloaded'})
            successPopup = await page.$('#charclub-success-container')
            if (!successPopup) {
                console.log(`Failed at: ${JSON.stringify(data)}`)
            }
            page.close()
        }
        
    }
})();