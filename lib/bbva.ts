import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import puppeteer, { Page } from "puppeteer";
import { IAccount } from "../interfaces/account";

export class BBVA {
  accounts: IAccount[] = [];

  async collectData(): Promise<void> {
    const browser = await puppeteer.launch({
      defaultViewport: { width: 1400, height: 768 },
    });
    const page = await browser.newPage();
    await page.goto("https://www.bbva.com.ar/");

    // Login
    await this.login(page);
    this.accounts = await this.getAccountsSummary(page);

    // Esperar para el logout y cierre
    await page.waitForTimeout(3000);
    await this.logout(page);
    await page.waitForTimeout(3000);
    await browser.close();

    const filename = path
      .resolve(`${__dirname}`, `../bbva-${dayjs().format("YYYY-MM-DD")}.json`)
      .replace("dist/", "");

    fs.writeFileSync(filename, JSON.stringify(this.accounts, null, 2));
  }

  private async getAccountsSummary(page: Page): Promise<IAccount[]> {
    await page.waitForSelector(".bg-black-close");
    await page.waitForSelector(".bg-black-close", { hidden: true });

    const accounts = await page.$$eval(
      ".account-summary-container",
      (accountContainers) =>
        accountContainers.map((account) => ({
          type: account
            .querySelector(".account-type")
            ?.textContent?.slice(0, -2) as string,
          number: account.querySelector(".account-number")
            ?.textContent as string,
          amount: account
            .querySelector(".account-amount")
            ?.textContent?.replace(/[a-zA-Z\s\.\n€$]/g, "")
            .replace(",", ".") as string,
          agreement:
            account
              .querySelector(".account-agreement")
              ?.textContent?.replace(/[a-zA-Z\s\.\n€$]/g, "")
              .replace(",", ".") || 0,
        }))
    );

    return accounts.map((a) => ({
      ...a,
      amount: +a.amount,
      agreement: +a.agreement,
    }));
  }

  private async logout(page: Page): Promise<void> {
    await page.waitForTimeout(10000);
    await page.waitForSelector("button.logout");
    await page.click("button.logout");
  }

  private async login(page: Page): Promise<void> {
    const DOCUMENT_NUMBER_INPUT = "input[id='documentNumberInput']";
    const USER_INPUT = "input[id='digitalUser']";
    const PASSWORD_INPUT = "input[id='digitalKey']";
    const LOGIN_BUTTON = "button[type='submit']";

    const documentNumber = process.env.BBVA_DOCUMENT as string;
    const username = process.env.BBVA_USER as string;
    const password = process.env.BBVA_PASSWORD as string;

    const loginButtonIdx = await page.$$eval("a span", (spans) =>
      spans.findIndex(
        (s) =>
          s.textContent === "Banca Online" &&
          [...s.classList].some((ci) => ci.includes("desktop"))
      )
    );

    if (loginButtonIdx >= 0) {
      await [...(await page.$$("a span"))][loginButtonIdx].click();
      const iframeHandle = await page.$(
        "iframe[src='/fnetcore/loginClementeApp.html']"
      );
      const iframe = await iframeHandle?.contentFrame();

      if (iframe) {
        await iframe?.waitForSelector(DOCUMENT_NUMBER_INPUT);
        await iframe?.waitForTimeout(2000);

        await iframe?.type(DOCUMENT_NUMBER_INPUT, documentNumber, {
          delay: 25,
        });
        await iframe?.waitForTimeout(250);
        await iframe?.type(USER_INPUT, username, { delay: 25 });
        await iframe?.waitForTimeout(250);
        await iframe?.type(PASSWORD_INPUT, password, { delay: 25 });
        await iframe?.waitForTimeout(250);
        await iframe?.click(LOGIN_BUTTON);
      }
    }
  }
}
