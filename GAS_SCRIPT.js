/**
 * GOOGLE APPS SCRIPT FOR GOOGLE SHEETS
 * Pasang kode ini di Google Sheets Anda: Extensions -> Apps Script
 * Deploy sebagai Web App dengan akses: "Anyone" (Siapa saja)
 */

function doPost(e) {
  try {
    var jsonString = e.postData.contents;
    var data = JSON.parse(jsonString);

    // 0. Penanganan Aksi HAPUS (action === "delete")
    if (data.action === "delete" && data.id) {
      var targetId = String(data.id).trim();
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheets = ss.getSheets();
      var deletedCount = 0;

      for (var s = 0; s < sheets.length; s++) {
        var sheet = sheets[s];
        var lastRow = sheet.getLastRow();
        if (lastRow < 2) continue;

        // Ambil kolom No (kolom 1/A) & ID (kolom 2/B)
        var range = sheet.getRange(2, 1, lastRow - 1, 2);
        var values = range.getValues();

        // Iterasi dari bawah ke atas agar indeks baris tidak bergeser saat dihapus
        for (var r = values.length - 1; r >= 0; r--) {
          var colNo = String(values[r][0]).trim();
          var colId = String(values[r][1]).trim();

          // Cocokkan berdasarkan ID (Kolom B) atau No jika ID cocok
          if ((colId && colId === targetId) || (colNo && colNo === targetId)) {
            sheet.deleteRow(r + 2);
            deletedCount++;
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Berhasil menghapus ulasan ID (" + targetId + ") dari " + deletedCount + " lokasi sheet."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var ratings = data.ratings || [];

    if (ratings.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Tidak ada data ulasan yang dikirim."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Dapatkan atau buat Sheet Gabungan
    var sheetGabunganName = "Laporan Gabungan";
    var sheetGabungan = ss.getSheetByName(sheetGabunganName);
    if (!sheetGabungan) {
      sheetGabungan = ss.insertSheet(sheetGabunganName);
      appendHeaders(sheetGabungan);
    }

    // 2. Proses baris data satu per satu
    for (var i = 0; i < ratings.length; i++) {
      var item = ratings[i];
      var rawDate = new Date(item.created_at || Date.now());
      
      // Format tanggal & bulan lokal WITA (Asia/Makassar / UTC+8)
      var fullDateStr = Utilities.formatDate(rawDate, "Asia/Makassar", "yyyy-MM-dd HH:mm");
      var monthKey = Utilities.formatDate(rawDate, "Asia/Makassar", "MM-yyyy");

      var rowData = [
        item.id || "-",
        fullDateStr,
        item.nama_pelangan || item.nama_pelanggan || "Anonim",
        item.unit_pelayanan || "PLN ULP Karebosi",
        item.rating_bintang || 0,
        item.keterangan_rating || "-",
        item.penilaian_pelayanan || "-",
        item.deskripsi || "-"
      ];

      // A. Simpan ke Sheet Gabungan jika belum ada
      if (!isDuplicate(sheetGabungan, item.id)) {
        // Tentukan nomor baris
        var nextNo = sheetGabungan.getLastRow();
        var fullRow = [nextNo].concat(rowData);
        sheetGabungan.appendRow(fullRow);
      }

      // B. Dapatkan atau buat Sheet bulanan (format: MM-YYYY)
      var sheetBulanan = ss.getSheetByName(monthKey);
      if (!sheetBulanan) {
        sheetBulanan = ss.insertSheet(monthKey);
        appendHeaders(sheetBulanan);
      }

      // Simpan ke Sheet bulanan jika belum ada
      if (!isDuplicate(sheetBulanan, item.id)) {
        var nextNoBln = sheetBulanan.getLastRow();
        var fullRowBln = [nextNoBln].concat(rowData);
        sheetBulanan.appendRow(fullRowBln);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Berhasil menyinkronkan " + ratings.length + " ulasan ke Google Sheets."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Terjadi kesalahan server: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Menambahkan header template standar dengan styling Corporate Blue
function appendHeaders(sheet) {
  var headers = [
    "No.", 
    "ID", 
    "Tanggal", 
    "Nama",
    "Unit", 
    "Bintang", 
    "Keterangan", 
    "Penilaian Emoji", 
    "Alasan/Deskripsi"
  ];
  sheet.appendRow(headers);
  
  // Format header (Biru Korporat, Teks Putih Tebal, Rata Tengah, Tinggi Baris 32px)
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setFontWeight("bold");
  range.setFontColor("#ffffff");
  range.setBackground("#3b689c");
  range.setHorizontalAlignment("center");
  range.setVerticalAlignment("middle");
  
  sheet.setRowHeight(1, 32);
  sheet.setFrozenRows(1);
}

// Cek apakah ID duplikat di sheet tujuan
function isDuplicate(sheet, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  
  var targetId = String(id).trim();
  // Ambil kolom ID (kolom ke-2 / B)
  var values = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === targetId) {
      return true;
    }
  }
  return false;
}

// Handler HTTP GET untuk pengujian URL Web App
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "PLN ULP Karebosi Rating Sync API",
    timezone: "Asia/Makassar (WITA)"
  })).setMimeType(ContentService.MimeType.JSON);
}
