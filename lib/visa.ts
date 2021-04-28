import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import {
  getAuthorizations,
  getCardList,
  getCardSummary,
  getLastMovements,
  selectCard,
} from "../helpers/card";
import { login } from "../helpers/login";
import { ICard } from "../interfaces/card";

export class Visa {
  cards: ICard[] = [];

  constructor() {}

  async collectData(): Promise<void> {
    const browser = await puppeteer.launch({
      defaultViewport: { width: 1280, height: 768 },
    });
    const page = await browser.newPage();
    await page.goto((process.env.SITE_URL + "/login") as string);

    await login(page);
    this.cards = (await getCardList(page)).map((c) => ({
      ...c,
      summary: [],
      movements: [],
      authorizations: [],
    }));

    for (let i = 0; i < this.cards.length; i++) {
      await selectCard(page, i + 1);
      this.cards[i].summary = await getCardSummary(page);
      this.cards[i].movements = await getLastMovements(page);
      this.cards[i].authorizations = await getAuthorizations(page);
    }

    const filename = path
      .resolve(`${__dirname}`, `../visa-${dayjs().format("YYYY-MM-DD")}.json`)
      .replace("dist/", "");

    fs.writeFileSync(filename, JSON.stringify(this.cards, null, 2));
    await browser.close();
  }
}
