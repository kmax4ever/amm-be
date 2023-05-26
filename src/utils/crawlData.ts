const { firefox } = require("playwright");
const link =
  "https://www.dextools.io/app/en/arbitrum/pair-explorer/0x400d7f19ca189762d7944a62ea351db8de54f571";

const waitMs = (msDuration) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null);
    }, msDuration);
  });
};

export const getData = async () => {
  try {
    const browser = await firefox.launch();
    const page = await browser.newPage();
    await page.goto(link);

    await waitMs(3000);
    const texts = await page.locator(`span.ng-tns-c101-6`).allInnerTexts();
    const liqidity = texts[3];
    const volume24h = texts[5];
    const pooledWETH = texts[6];
    const pooledPZT = texts[7];
    const marketcap = texts[9];
    const totalSupply = texts[9];
    const holders = texts[10];
    const totalTx = texts[11];
    const createdAt = texts[12];

    await page.close();
    await browser.close();
    return {
      liqidity,
      volume24h,
      pooledWETH,
      pooledPZT,
      marketcap,
      totalSupply,
      holders,
      totalTx,
      createdAt,
    };
  } catch (error) {
    console.log(error.message);
    return null;
  }
};
