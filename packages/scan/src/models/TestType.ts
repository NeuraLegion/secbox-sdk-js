export enum TestType {
  ANGULAR_CSTI = 'angular_csti',
  BACKUP_LOCATIONS = 'backup_locations',
  BROKEN_SAML_AUTH = 'broken_saml_auth',
  BRUTE_FORCE_LOGIN = 'brute_force_login',
  BUSINESS_CONSTRAINT_BYPASS = 'business_constraint_bypass',
  COMMON_FILES = 'common_files',
  COOKIE_SECURITY = 'cookie_security',
  CSRF = 'csrf',
  DATE_MANIPULATION = 'date_manipulation',
  DEFAULT_LOGIN_LOCATION = 'default_login_location',
  DIRECTORY_LISTING = 'directory_listing',
  DOM_XSS = 'dom_xss',
  EMAIL_INJECTION = 'email_injection',
  EXPOSED_COUCH_DB_APIS = 'exposed_couch_db_apis',
  FILE_UPLOAD = 'file_upload',
  FULL_PATH_DISCLOSURE = 'full_path_disclosure',
  HEADER_SECURITY = 'header_security',
  HRS = 'hrs',
  HTML_INJECTION = 'html_injection',
  HTTP_METHOD_FUZZING = 'http_method_fuzzing',
  HTTP_RESPONSE_SPLITTING = 'http_response_splitting',
  ID_ENUMERATION = 'id_enumeration',
  IMPROPER_ASSET_MANAGEMENT = 'improper_asset_management',
  INSECURE_TLS_CONFIGURATION = 'insecure_tls_configuration',
  JWT = 'jwt',
  LDAPI = 'ldapi',
  LFI = 'lfi',
  MASS_ASSIGNMENT = 'mass_assignment',
  NOSQL = 'nosql',
  OPEN_BUCKETS = 'open_buckets',
  OPEN_DATABASE = 'open_database',
  OSI = 'osi',
  PROTO_POLLUTION = 'proto_pollution',
  RETIRE_JS = 'retire_js',
  RFI = 'rfi',
  SECRET_TOKENS = 'secret_tokens',
  SERVER_SIDE_JS_INJECTION = 'server_side_js_injection',
  SQLI = 'sqli',
  SSRF = 'ssrf',
  SSTI = 'ssti',
  UNVALIDATED_REDIRECT = 'unvalidated_redirect',
  VERSION_CONTROL_SYSTEMS = 'version_control_systems',
  WORDPRESS = 'wordpress',
  XPATHI = 'xpathi',
  XSS = 'xss',
  XXE = 'xxe'
}
