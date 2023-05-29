import {decode} from "html-entities";
import {camelCase} from "change-case";
import { DateHelper } from "../helpers/DateHelper";

interface WhoisResponse {
  origin: 'whois',
  domainExpirationDate: string | null
  registrar: {
    name: string | null
    url: string | null
    owner: string | null
    tech: string | null
  },
  provider: string | null
  nameServers: string | null
}

class WhoisData {
  protected rawData: string | undefined;
  protected whoisResponse: { [key: string]: string } | undefined;
  protected currentServer: any;

  constructor(data: string | { [key: string]: string }) {
    this.rawData = (typeof data === 'string') ? data : undefined
    this.whoisResponse = (typeof data === 'object')? data : undefined
  }

  public parse() {
    if (!this.rawData || typeof this.rawData !== 'string') {
      throw new Error('rawData is missing or is not a string');
    }

    const decodedRawData: string = decode(this.rawData)

    let result: { [key: string]: string } = {};

    decodedRawData
      .split('\n')
      .filter(line => !line.startsWith('%'))
      .filter(line => line.includes(':'))
      .forEach(line => {
        const lineParts = line
          .replace(/<+$/, '')
          .trim()
          .split(/:(?!\/\/)/)
          .filter(part => part.trim() !== '');

        if (lineParts.length > 1) {
          const key = camelCase(lineParts[0])
          const value = lineParts
            .splice(1)
            .join(':')
            .replace(/<+$/, '')
            .trim()

          if (key in result) {
            result[key] = `${result[key]} ${value}`;
            return
          }

          result[key] = value;
        }
      });

    this.whoisResponse = result;

    return this;
  }

  public getParsed() {
    if (!this.whoisResponse || typeof this.whoisResponse !== 'object') {
      throw new Error('whoisResponse is missing or is not an object. Run the parser first.');
    }
    return this.whoisResponse;
  }

  protected fetchData(keyIncludes: string[], processor?: (data: any) => any) {
    if (!this.whoisResponse || typeof this.whoisResponse !== 'object') {
      throw new Error('whoisResponse is missing or is not an object');
    }

    // Check for the exact key match first
    for (const key of keyIncludes) {
      const exactMatchData = this.whoisResponse[key];
      if (exactMatchData) {
        return processor ? processor(exactMatchData) : exactMatchData;
      }
    }

    // If no exact match found, perform partial key match
    const whoisResponseEntries = Object.entries(this.whoisResponse || {});
    for (const [key, data] of whoisResponseEntries) {
      if (keyIncludes.some(inclusion => key.includes(inclusion)) && data) {
        return processor ? processor(data) : data;
      }
    }
    return null;
  }

  protected isBrDomain() {
    if (!this.whoisResponse || typeof this.whoisResponse !== 'object') {
      throw new Error('whoisResponse is missing or is not an object');
    }

    return this.whoisResponse?.domainName?.endsWith('.br') || this.whoisResponse?.domain?.endsWith('.br') || false;
  }

  protected getExpirationDate() {
    return this.fetchData(['xpir'], dateFromWhois => new DateHelper().getDateFromString(dateFromWhois));
  }

  protected getNameServers() {
    return this.fetchData(['nserver', 'nameServer'], nameServers => nameServers.split(' '));
  }

  protected getRegistrar() {
    return this.fetchData(['registrar']) || (this.isBrDomain() ? 'Registro BR' : null);
  }

  protected getProvider() {
    return this.fetchData(['provider']) || this.getRegistrar() || (this.isBrDomain() ? 'Registro BR' : null);
  }

  protected getRegistrarUrl() {
    return this.fetchData(['registrarUrl']) || (this.isBrDomain() ? 'https://registro.br' : null);
  }

  protected getRegistrarOwner() {
    return this.fetchData(['ownerC']) || (this.isBrDomain() ? this.currentServer.data.ownerC : null);
  }

  protected getRegistrarTech() {
    return this.fetchData(['techC']) || (this.isBrDomain() ? this.currentServer.data.techC : null);
  }

  public buildResponse(): WhoisResponse {
    if (!this.whoisResponse) {
      return {
        origin: 'whois',
        domainExpirationDate: null,
        registrar: {
          name: null,
          url: null,
          owner: null,
          tech: null,
        },
        provider: null,
        nameServers: null,
      }
    }

    return {
      origin: 'whois',
      domainExpirationDate: this.getExpirationDate(),
      registrar: {
        name: this.getRegistrar(),
        url: this.getRegistrarUrl(),
        owner: this.getRegistrarOwner(),
        tech: this.getRegistrarTech()
      },
      provider: this.getProvider(),
      nameServers: this.getNameServers(),
    }
  }
}

export { WhoisData, WhoisResponse }
