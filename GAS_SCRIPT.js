/**
 * GOOGLE APPS SCRIPT FOR GOOGLE SHEETS
 * Pasang kode ini di Google Sheets Anda: Extensions -> Apps Script
 * Deploy sebagai Web App dengan akses: "Anyone" (Siapa saja)
 */

function doPost(e) {
  try {
    var jsonString = e.postData.contents;
    var data = JSON.parse(jsonString);
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
      
      // Format tanggal lokal YYYY-MM-DD
      var year = rawDate.getFullYear();
      var monthNum = rawDate.getMonth() + 1;
      var monthStr = ("0" + monthNum).slice(-2);
      var day = ("0" + rawDate.getDate()).slice(-2);
      var dateKey = year + "-" + monthStr + "-" + day;

      // Nama bulan untuk nama sheet bulanan (Format: YYYY-MM)
      var monthKey = year + "-" + monthStr;

      // Ambil jam menit
      var timeStr = ("0" + rawDate.getHours()).slice(-2) + ":" + ("0" + rawDate.getMinutes()).slice(-2);
      var fullDateStr = dateKey + " " + timeStr;

      var rowData = [
        item.id || "-",
        fullDateStr,
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

      // B. Dapatkan atau buat Sheet bulanan (format: YYYY-MM)
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

// Menambahkan header template standar
function appendHeaders(sheet) {
  var headers = [
    "No.", 
    "ID", 
    "Tanggal", 
    "Unit ", 
    "Bintang ", 
    "Keterangan", 
    "Penilaian Emoji", 
    "Alasan/Deskripsi"
  ];
  sheet.appendRow(headers);
  
  // Format header (Tebal & latar belakang abu-abu terang)
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setFontWeight("bold");
  range.setBackground("#f3f4f6");
  sheet.setFrozenRows(1);
}

// Cek apakah ID duplikat di sheet tujuan
function isDuplicate(sheet, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  
  // Ambil kolom ID (kolom ke-2)
  var values = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === id) {
      return true;
    }
  }
  return false;
}
