import { CalcappPage } from './app.po';

describe('calcapp App', () => {
  let page: CalcappPage;

  beforeEach(() => {
    page = new CalcappPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
