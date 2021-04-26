import { Page } from "puppeteer";

export const login = async (page: Page) => {
  const numberInput = '[id="loginFrm:docNumber"]';
  const passwordInput = '[id="loginFrm:password"]';
  const confirmButton = '[id="loginFrm:button"]';

  const user = process.env.USER_NUMBER as string;
  const password = process.env.USER_PASSWORD as string;

  await page.waitForSelector(numberInput);
  await page.click(numberInput);
  await page.type(numberInput, user);
  await page.click(passwordInput);
  await page.type(passwordInput, password);
  await page.click(confirmButton);
};

export const logout = (page: Page) => {
  const optionsSelect = "[id='actionsDropDown']";

  page.waitForSelector(optionsSelect);
  page.click(optionsSelect);
};
