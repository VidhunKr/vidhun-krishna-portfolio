/**
 * Portfolio contact form → Google Sheet + email
 * Paste this into: Google Sheet → Extensions → Apps Script
 *
 * Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Then paste the /exec URL into js/config.js → GOOGLE_SCRIPT_URL
 */

var TO_ADDRESS = "vidhunkrishna007@gmail.com";

function doPost(e) {
  try {
    record_data(e);

    var mailData = e.parameters;
    var sendEmailTo = TO_ADDRESS;

    if (sendEmailTo) {
      var visitorName = toTitleCase(
        ((mailData.name || "Portfolio Visitor").toString()).slice(0, 80)
      );
      var visitorEmail = ((mailData.email || TO_ADDRESS).toString()).trim();

      // From address is ALWAYS the Google account that owns this script
      // (e.g. vidhun.saihasoft). We cannot send "as" the visitor — Gmail blocks that.
      // `name` = what shows in the inbox; `replyTo` = where Reply goes.
      MailApp.sendEmail({
        to: String(sendEmailTo),
        name: visitorName + " Via Portfolio",
        replyTo: visitorEmail,
        subject: "New Portfolio Enquiry From " + visitorName,
        htmlBody: formatMailBody(mailData, visitorName)
      });
    }

    return ContentService
      .createTextOutput("success")
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService
      .createTextOutput("error")
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function record_data(e) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var formType = e.parameters.formType ? e.parameters.formType.toString() : "ContactForm";
    var sheet = doc.getSheetByName(formType);

    if (!sheet) {
      sheet = doc.insertSheet(formType);
      sheet.getRange(1, 1, 1, 2).setValues([["Timestamp", "FormType"]]);
    }

    var headersRange = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1);
    var headers = headersRange.getValues()[0];

    if (headers.length === 0 || (headers.length === 1 && headers[0] === "")) {
      headers = ["Timestamp", "FormType"];
      sheet.getRange(1, 1, 1, 2).setValues([headers]);
    }

    var fieldNames = Object.keys(e.parameters).filter(function (key) {
      return key !== "formGoogleSheetName" && key !== "formGoogleSendEmail";
    });

    fieldNames.forEach(function (field) {
      if (headers.indexOf(field) === -1) {
        headers.push(field);
      }
    });

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    var rowData = headers.map(function (header) {
      if (header === "Timestamp") return new Date();
      if (header === "FormType") return formType;
      return e.parameters[header] ? e.parameters[header].toString() : "";
    });

    sheet.appendRow(rowData);
  } catch (error) {
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function toTitleCase(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\b([a-z])/g, function (match) {
      return match.toUpperCase();
    });
}

function formatMailBody(data, titledName) {
  var name = titledName || toTitleCase((data.name || "").toString());
  var email = (data.email || "").toString();
  var message = (data.message || "").toString();

  return (
    "<div style='font-family:Arial,sans-serif;line-height:1.6;color:#111;'>" +
    "<h2 style='margin:0 0 16px;'>New Portfolio Enquiry</h2>" +
    "<p><strong>Name:</strong> " + sanitizeInput(name) + "</p>" +
    "<p><strong>Email:</strong> " + sanitizeInput(email) + "</p>" +
    "<p style='margin:16px 0 6px;'><strong>Message:</strong></p>" +
    "<p style='white-space:pre-wrap;margin:0;'>" + sanitizeInput(message) + "</p>" +
    "</div>"
  );
}

function sanitizeInput(rawInput) {
  var placeholder = HtmlService.createHtmlOutput(" ");
  placeholder.appendUntrusted(rawInput);
  return placeholder.getContent();
}

function doOptions() {
  return HtmlService.createHtmlOutput("Options request handled");
}
