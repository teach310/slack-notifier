// spreadsheetおよび検索結果のキャッシュ
class SheetReader {
  constructor(spreadsheet) {
    this.spreadsheet = spreadsheet
    this.cache = {}
  }

  snakeToCamel(p) {
    //_+小文字を大文字にする(例:_a を A)
    return p.replace(/_./g,
      function (s) {
        return s.charAt(1).toUpperCase();
      }
    )
  }

  findAll(sheetName){
    if (sheetName in this.cache){
      return this.cache[sheetName];
    }
    const sheet = this.spreadsheet.getSheetByName(sheetName);
    const rows = sheet.getDataRange().getValues();
    const keys = rows.splice(0, 2)[0]; //　0: カラム名 1: コメント
    const result = rows.map((row) => {
      return row.reduce((acc, value, index) => {
        const key = this.snakeToCamel(keys[index]);
        acc[key] = value;
        return acc;
      }, {})
    });
    this.cache[sheetName] = result;
    return result;
  }
}

const test_findAll = () => {
  reader = new SheetReader(SpreadsheetApp.getActive());
  try {
    let users = reader.findAll("users");
    console.log(users);
    // キャッシュ確認
    users = reader.findAll("users"); 
    console.log(users);
  } catch (e) {
    console.log(e)
  }
}
