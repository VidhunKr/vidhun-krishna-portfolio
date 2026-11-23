/**
 * Portfolio contact form + AI chatbot transcripts → Google Sheet + email
 * Paste this into: Google Sheet → Extensions → Apps Script
 *
 * Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Then paste the /exec URL into:
 *   - js/config.js → GOOGLE_SCRIPT_URL (contact form)
 *   - Vercel env → GOOGLE_SCRIPT_URL (chat summary API)
 *
 * Also set Script Property CHAT_EMAIL_SECRET to the same value as
 * Vercel env CHAT_EMAIL_SECRET (Project Settings → Script properties).
 */

var TO_ADDRESS = "vidhunkrishna007@gmail.com";
var AI_CHAT_SHEET = "AI Chat Conversations";

function doPost(e) {
  try {
    var params = (e && e.parameters) ? e.parameters : {};
    var formType = params.formType ? params.formType.toString() : "ContactForm";

    if (formType === "AIChatConversations") {
      return handleAiChat(params);
    }

    return handleContactForm(e, params);
  } catch (error) {
    return ContentService
      .createTextOutput("error")
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function handleContactForm(e, mailData) {
  record_data(e);

  var sendEmailTo = TO_ADDRESS;
  if (sendEmailTo) {
    var visitorName = toTitleCase(
      ((mailData.name || "Portfolio Visitor").toString()).slice(0, 80)
    );
    var visitorEmail = ((mailData.email || TO_ADDRESS).toString()).trim();

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
}

function handleAiChat(params) {
  if (!verifyChatSecret(params.chatSecret)) {
    return ContentService
      .createTextOutput("unauthorized")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  var conversationId = ((params.conversationId || "").toString()).trim().slice(0, 64);
  if (!conversationId) {
    return ContentService
      .createTextOutput("error")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  if (aiChatAlreadyRecorded(conversationId)) {
    return ContentService
      .createTextOutput("duplicate")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  var summary = ((params.summary || "").toString()).slice(0, 4000);
  var transcript = ((params.transcript || "").toString()).slice(0, 20000);
  var sessionId = ((params.sessionId || "").toString()).slice(0, 64);
  var messageCount = ((params.messageCount || "").toString()).slice(0, 12);
  var visitorContact = ((params.visitorContact || "").toString()).slice(0, 200);
  var reason = ((params.reason || "").toString()).slice(0, 40);
  var dateValue = ((params.date || "").toString()).slice(0, 32);
  var timeValue = ((params.time || "").toString()).slice(0, 32);

  var emailOk = false;
  var sheetOk = false;
  var emailError = "";

  try {
    MailApp.sendEmail({
      to: TO_ADDRESS,
      name: "AI Portfolio Assistant",
      subject: "New AI Chat Conversation – Portfolio Website",
      htmlBody: formatAiChatMail({
        conversationId: conversationId,
        sessionId: sessionId,
        dateValue: dateValue,
        timeValue: timeValue,
        summary: summary,
        transcript: transcript,
        messageCount: messageCount,
        visitorContact: visitorContact,
        reason: reason
      })
    });
    emailOk = true;
  } catch (mailErr) {
    emailError = String(mailErr);
  }

  try {
    recordAiChatRow({
      conversationId: conversationId,
      dateValue: dateValue,
      timeValue: timeValue,
      sessionId: sessionId,
      summary: summary,
      transcript: transcript,
      messageCount: messageCount,
      visitorContact: visitorContact,
      emailStatus: emailOk ? "sent" : ("failed: " + emailError).slice(0, 180),
      reason: reason
    });
    sheetOk = true;
  } catch (sheetErr) {
    // Keep going — email may have succeeded independently
  }

  if (emailOk || sheetOk) {
    return ContentService
      .createTextOutput("success")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  return ContentService
    .createTextOutput("error")
    .setMimeType(ContentService.MimeType.TEXT);
}

function verifyChatSecret(provided) {
  // Optional: if CHAT_EMAIL_SECRET is set in Script Properties, require a match.
  // If not set, allow chat emails the same way as the public contact form.
  var expected = PropertiesService.getScriptProperties().getProperty("CHAT_EMAIL_SECRET");
  if (!expected) return true;
  return String(provided || "") === String(expected);
}

function getAiChatSheet_() {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName(AI_CHAT_SHEET);
  var headers = [
    "Timestamp",
    "Conversation ID",
    "Date",
    "Time",
    "Visitor Session ID",
    "Conversation Summary",
    "Full Transcript",
    "Message Count",
    "Visitor Contact Details",
    "Email Status",
    "Reason"
  ];

  if (!sheet) {
    sheet = doc.insertSheet(AI_CHAT_SHEET);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
  }

  var existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  if (!existing[0]) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function aiChatAlreadyRecorded(conversationId) {
  var sheet = getAiChatSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  var ids = sheet.getRange(2, 2, lastRow, 2).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(conversationId)) return true;
  }
  return false;
}

function recordAiChatRow(data) {
  var sheet = getAiChatSheet_();
  sheet.appendRow([
    new Date(),
    data.conversationId,
    data.dateValue,
    data.timeValue,
    data.sessionId,
    data.summary,
    data.transcript,
    data.messageCount,
    data.visitorContact,
    data.emailStatus,
    data.reason
  ]);
}

function formatAiChatMail(data) {
  return (
    "<div style='font-family:Arial,sans-serif;line-height:1.6;color:#111;'>" +
    "<h2 style='margin:0 0 16px;'>New AI Chat Conversation</h2>" +
    "<p><strong>Conversation ID:</strong> " + sanitizeInput(data.conversationId) + "</p>" +
    "<p><strong>Session ID:</strong> " + sanitizeInput(data.sessionId) + "</p>" +
    "<p><strong>Date:</strong> " + sanitizeInput(data.dateValue) + "</p>" +
    "<p><strong>Time:</strong> " + sanitizeInput(data.timeValue) + "</p>" +
    "<p><strong>Message count:</strong> " + sanitizeInput(data.messageCount) + "</p>" +
    "<p><strong>End reason:</strong> " + sanitizeInput(data.reason) + "</p>" +
    (data.visitorContact
      ? "<p><strong>Visitor contact (optional):</strong> " + sanitizeInput(data.visitorContact) + "</p>"
      : "") +
    "<h3 style='margin:20px 0 8px;'>Summary</h3>" +
    "<p style='white-space:pre-wrap;margin:0;'>" + sanitizeInput(data.summary) + "</p>" +
    "<h3 style='margin:20px 0 8px;'>Full transcript</h3>" +
    "<pre style='white-space:pre-wrap;background:#f6f7f9;padding:12px;border-radius:8px;font-size:13px;'>" +
    sanitizeInput(data.transcript) +
    "</pre>" +
    "</div>"
  );
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
