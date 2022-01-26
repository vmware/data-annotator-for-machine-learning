import {
  ElementFinder,
  ExpectedConditions,
  browser,
  by,
  element,
  protractor,
  ElementArrayFinder,
  promise,
} from "protractor";

export class FunctionUtil {
  private static DEFAULT_TIME_OUT = 60 * 1000;

  public static async selectFromListByIndex(
    ele: ElementFinder,
    item: string,
    num: number
  ) {
    const selItem = item + "(" + num + ")";
    const SEL_Item = element(by.css(selItem));
    await ele.click();
    await FunctionUtil.elementVisibilityOf(SEL_Item);
    await ele.$(selItem).click();
  }

  public static async sendText(ele: ElementFinder, text: string) {
    await FunctionUtil.elementVisibilityOf(ele);
    await ele.clear();
    await ele.sendKeys(text);
  }

  public static getElementsNum(ele: ElementArrayFinder): Promise<number> {
    return ele.count() as Promise<number>;
  }
  public static async pressEnter() {
    await browser.actions().sendKeys(protractor.Key.ENTER).perform();
  }
  public static getValue(ele: ElementFinder): Promise<string> {
    return ele.getAttribute("value") as Promise<string>;
  }
  public static async getAttribute(ele: ElementFinder, attribute: string) {
    await FunctionUtil.elementVisibilityOf(ele);
    return ele.getAttribute(attribute);
  }
  public static async checkCheckBox(ele: ElementFinder): Promise<void> {
    const flag = await ele.isSelected();
    if (!flag) {
      browser.actions().mouseMove(ele).click().perform();
    }
  }
  public static async uncheckCheckBox(ele: ElementFinder): Promise<void> {
    const flag = await ele.isSelected();
    if (flag) {
      browser.actions().mouseMove(ele).click().perform();
    }
  }
  public static async deleteTagByValue(
    eleDelet: ElementFinder,
    eleCancel: ElementFinder,
    value: string
  ): Promise<void> {
    const rows = element.all(by.css('clr-dg-row[role="rowgroup"]'));
    return rows.each(async (row) => {
      const cells = row.$$("clr-dg-cell");
      const txt = await cells.get(0).getText();
      if (txt === value) {
        await cells.get(2).$(".remove").click();
        await browser.sleep(2000);
        await eleCancel.click();
        await cells.get(2).$(".remove").click();
        await browser.sleep(2000);
        await eleDelet.click();
      }
    });
  }
  public static async deleteTemplateByValue(
    eleDelet: ElementFinder,
    eleCancel: ElementFinder,
    value: string
  ) {
    const rows = element.all(by.css('clr-dg-row[role="rowgroup"]'));
    return rows.each(async (row) => {
      const cells = row.$$("clr-dg-cell");
      const txt = await cells.get(0).getText();
      if (txt === value) {
        await element(by.css('clr-dg-row[role="rowgroup"]')).click();
        await eleDelet.click();
        await browser.sleep(2000);
        await eleCancel.click();
        await eleDelet.click();
        await browser.sleep(2000);
        await element(by.css(".btn-primary")).click();
      }
    });
  }
  public static async clickFilterInFilterManageByValue(value: string) {
    const rows = element.all(by.css(".slide a"));
    return rows.each(async (row) => {
      const txt = await row.getText();
      if (txt === value) {
        await row.click();
      }
    });
  }
  public static async putFilterVaule(ele: ElementFinder, value: string) {
    await FunctionUtil.sendText(ele, value);
    await FunctionUtil.pressEnter();
  }
  public static async putFilterValueInAdvnced(
    ele: ElementFinder,
    value: string
  ) {
    await FunctionUtil.sendText(ele, value);
  }
  public static async getSelectByValue(
    ele: ElementFinder,
    searchEle: ElementFinder,
    putSearchKey: string
  ) {
    await ele.click();
    await this.sendText(searchEle, putSearchKey);
    await FunctionUtil.pressEnter();
  }
  public static async click(ele: ElementFinder) {
    await FunctionUtil.elementVisibilityOf(ele);
    await ele.click();
  }
  public static async getElementText(ele: ElementFinder): Promise<string> {
    await FunctionUtil.elementVisibilityOf(ele);
    return ele.getText();
  }
  public static async elementStalenessOf(ele: ElementFinder) {
    await browser.wait(
      ExpectedConditions.stalenessOf(ele),
      FunctionUtil.DEFAULT_TIME_OUT
    );
  }
  public static async elementVisibilityOf(ele: ElementFinder) {
    await browser.wait(
      ExpectedConditions.visibilityOf(ele),
      FunctionUtil.DEFAULT_TIME_OUT
    );
  }
  public static async urlContains(text: string) {
    await browser.wait(
      ExpectedConditions.urlContains(text),
      FunctionUtil.DEFAULT_TIME_OUT
    );
  }
  public static async textToBePresentInElement(
    ele: ElementFinder,
    str: string
  ) {
    await browser.wait(
      ExpectedConditions.textToBePresentInElement(ele, str),
      FunctionUtil.DEFAULT_TIME_OUT
    );
  }

  public static async elementToBeClickable(ele: ElementFinder) {
    await browser.wait(
      ExpectedConditions.elementToBeClickable(ele),
      FunctionUtil.DEFAULT_TIME_OUT
    );
  }

  public static async presenceOf(ele: ElementFinder) {
    await browser.wait(
      ExpectedConditions.presenceOf(ele),
      FunctionUtil.DEFAULT_TIME_OUT
    );
  }
  public static async titleCourlContains(str: string) {
    await browser.wait(
      ExpectedConditions.urlContains(str),
      FunctionUtil.DEFAULT_TIME_OUT
    );
  }

  public static async operationSuspensionElements(
    ele: ElementFinder,
    operationEle: ElementFinder
  ) {
    console.log("start hover to show the delete icon...");
    await browser.actions().mouseMove(ele).perform();
    await FunctionUtil.click(operationEle);
    console.log("succeed to click the delete icon...");
  }

  public static async clear(str) {
    str = await str.split(".").join("");
    return await str;
  }

  public static async mouseDragMove(el, start, end) {
    await browser
      .actions()
      .mouseMove(el, { x: start.x, y: start.y })
      .mouseDown()
      .mouseMove({ x: end.x, y: end.y })
      .perform();
    await browser.sleep(1000);
    await browser.actions().mouseUp().perform();
    await browser.sleep(1000);
  }

  public static async mouseMoveToClick(el, taget) {
    await browser
      .actions()
      .mouseMove(el, { x: taget.x, y: taget.y })
      .click()
      .perform();
    await browser.sleep(1000);
  }

  public static async mouseDownToClick(el, taget) {
    await browser
      .actions()
      .mouseMove(el, { x: taget.x, y: taget.y })
      .mouseDown()
      .click()
      .perform();
    await browser.sleep(1000);
  }

  public static async acceptAlertPopup() {
    if (await ExpectedConditions.alertIsPresent()) {
      await browser.switchTo().alert().accept();
    }
  }

  public static async mouseDragAnnotate(el1, el2) {
    await browser.actions().mouseMove(el1).mouseDown().mouseMove(el2).perform();
    await browser.sleep(1000);
    await browser.actions().mouseUp().perform();
    await browser.sleep(1000);
  }
}
