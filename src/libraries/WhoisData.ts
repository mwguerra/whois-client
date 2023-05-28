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
  protected rawData: string;
  protected parsedData: object | undefined;
  protected whoisResponse: any;
  protected currentServer: any;

  constructor(rawData: string) {
    this.rawData = rawData
  }

  public parse() {
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

    this.parsedData = result;

    return this;
  }

  public getParsed() {
    return this.parsedData;
  }

  protected fetchData(keyIncludes: string[], processor?: (data: any) => any) {
    for (const server of this.whoisResponse) {
      this.currentServer = server;  // Set current server here
      const dataKeys = Object.keys(server?.data);
      const targetKeys = dataKeys.filter(key => keyIncludes.some(inclusion => key.includes(inclusion)));

      for (const key of targetKeys) {
        const data = server.data[key];
        if (data) {
          return processor ? processor(data) : data;
        }
      }
    }
    return null;
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

  protected isBrDomain() {
    for (const server of this.whoisResponse) {
      if (server.data.domain?.endsWith('.br')) {
        return true;
      }
    }
    return false;
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
