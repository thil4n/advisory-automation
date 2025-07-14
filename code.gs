// Target directory = https://drive.google.com/drive/folders/[id]

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index');
}

function stripPTags(text) {
  if (!text) return '';
  return text.replace(/<\/?p>/gi, '');
}

function createDocument(formData) {
  try {
    var data = JSON.parse(formData.json);
    var url = copyGoogleDocWithData(data);
    return url;
  } catch (e) {
    return "Error parsing JSON: " + e.message;
  }
}

function copyGoogleDocWithData(jsonData) {
  var dependencyUpgradeTemplateId = '';
  var internalVulnerbilityTemplateId = '';
  var securityEnhancementTemplateId = '';

  var folderId = '1hHtAWW81dl8pnVgy1gDA9TFkNeOYOXK_';

  // validate jsonData structure
  if (!jsonData.data || !jsonData.data[0] || !jsonData.data[0].name) {
    throw new Error('Missing required field: data[0].name');
  }

  var advisory = jsonData.data[0];
  var newFileName = advisory.name;

  // Select the proper template
  if(advisory.advisoryType == "dependancyUpgrade"){
    templateId = dependencyUpgradeTemplateId;
  }else   if(advisory.advisoryType == "internalVulnerability"){
    templateId = internalVulnerbilityTemplateId;
  } else{
        templateId = securityEnhancementTemplateId;
  }

  // Make a copy of the template
  var templateFile = DriveApp.getFileById(templateId);
  var copiedFile = templateFile.makeCopy(newFileName);

  // Move to target folder
  var targetFolder = DriveApp.getFolderById(folderId);
  targetFolder.addFile(copiedFile);
  DriveApp.getRootFolder().removeFile(copiedFile);

  Utilities.sleep(2000); // wait a bit so the copy is fully ready

  copiedFile.setSharing(DriveApp.Access.DOMAIN, DriveApp.Permission.EDIT);

  // Open and replace text
  var doc = DocumentApp.openById(copiedFile.getId());
  var body = doc.getBody();

  // Replace placeholders with data from JSON
  body.replaceText('{{LINK}}', advisory.link || 'https://[domain]/dashboard/advisory?name=' + newFileName);
  body.replaceText('{{DATE}}', advisory.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'));

  body.replaceText('{{FIXED_TEAM_OVERVIEW}}', stripPTags(advisory.overview) || '<>');
  body.replaceText('{{FIXED_TEAM_DESCRIPTION}}', stripPTags(advisory.description) || '<>');
  body.replaceText('{{FIXED_TEAM_IMPACT}}', stripPTags(advisory.impact) || '<>');
  body.replaceText('{{FIXED_TEAM_SOLUTION}}', stripPTags(advisory.solution) || '<>');
  body.replaceText('{{FIXED_TEAM_NOTES}}', stripPTags(advisory.notes) || '<>');
  body.replaceText('{{FIXED_TEAM_VULNERBALE_COMPONENTS}}', stripPTags(advisory.vulnerableComponents) || '<>');


  doc.saveAndClose();

  var url = copiedFile.getUrl();
  Logger.log('Document created: ' + url);
  return url;
}
