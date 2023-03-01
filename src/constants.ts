enum ERRORS {
  NoDomainError = "You must enter a domain.",
  DomainParseError = "Error parsing the domain.",
  UnknownTLD = 'Unable to find the top level domain.',
  WhoisError = 'Error making Whois request.',
  WhoisResponseEmpty = 'Whois request returned no value.',
}

export { ERRORS }