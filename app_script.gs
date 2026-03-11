function onOpen() {
  DocumentApp.getUi()
    .createMenu('Tools+')
    .addItem('Selection → Table', 'selectionToTable')
    .addItem('Table → Wide Fit', 'tableToWide')
    .addToUi();
}

function selectionToTable() {
  var doc = DocumentApp.getActiveDocument();
  var selection = doc.getSelection();

  if (!selection) {
    DocumentApp.getUi().alert('Please highlight some text first, then run again.');
    return;
  }

  var lines = [];
  var elements = selection.getRangeElements();
  for (var i = 0; i < elements.length; i++) {
    var el = elements[i].getElement();
    var text = el.asText().getText().trim();
    if (text !== '') lines.push(text);
  }

  if (lines.length === 0) {
    DocumentApp.getUi().alert('No text found in selection.');
    return;
  }

  var body = doc.getBody();
  var firstEl = elements[0].getElement();
  var parent = firstEl;
  while (parent.getParent() && parent.getParent().getType() !== DocumentApp.ElementType.BODY_SECTION) {
    parent = parent.getParent();
  }
  var insertIndex = body.getChildIndex(parent);

  var toRemove = [];
  for (var j = 0; j < elements.length; j++) {
    var p = elements[j].getElement();
    while (p.getParent() && p.getParent().getType() !== DocumentApp.ElementType.BODY_SECTION) {
      p = p.getParent();
    }
    if (p.getType() === DocumentApp.ElementType.PARAGRAPH && toRemove.indexOf(p) === -1) {
      toRemove.push(p);
    }
  }
  for (var k = toRemove.length - 1; k >= 0; k--) {
    try { body.removeChild(toRemove[k]); } catch(e) {}
  }

  var tableData = lines.map(function(line) { return [line]; });
  var table = body.insertTable(insertIndex, tableData);
  applyWideFit(table);
}

function tableToWide() {
  var doc = DocumentApp.getActiveDocument();
  var cursor = doc.getCursor();
  var selection = doc.getSelection();
  var table = null;

  if (cursor) {
    var el = cursor.getElement();
    while (el) {
      if (el.getType() === DocumentApp.ElementType.TABLE) { table = el.asTable(); break; }
      try { el = el.getParent(); } catch(e) { break; }
    }
  }

  if (!table && selection) {
    var rangeEls = selection.getRangeElements();
    for (var i = 0; i < rangeEls.length; i++) {
      var el2 = rangeEls[i].getElement();
      while (el2) {
        if (el2.getType() === DocumentApp.ElementType.TABLE) { table = el2.asTable(); break; }
        try { el2 = el2.getParent(); } catch(e) { break; }
      }
      if (table) break;
    }
  }

  if (!table) {
    DocumentApp.getUi().alert('Please click inside a table first, then run again.');
    return;
  }

  applyWideFit(table);
}

function applyWideFit(table) {
  // Set border width = 1pt on every cell, and clear fixed column width (set to 0 = auto/unchecked)
  for (var r = 0; r < table.getNumRows(); r++) {
    var row = table.getRow(r);
    for (var c = 0; c < row.getNumCells(); c++) {
      var cell = row.getCell(c);

      // Clear fixed column width -> unchecks the "Column width" checkbox in UI
      var cellStyle = {};
      cellStyle[DocumentApp.Attribute.WIDTH] = null;
      cellStyle[DocumentApp.Attribute.BORDER_WIDTH] = 1;
      cell.setAttributes(cellStyle);
    }
  }
}
