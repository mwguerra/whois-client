import {SocksClient, SocksClientOptions} from "socks";
import {SocksClientEstablishedEvent, SocksProxy} from "socks/typings/common/constants";
import fs from "fs";
// @ts-ignore
import whois from "whois";
import net from 'net'
import util from "util";
import { DomainHelper } from "../helpers/DomainHelper";
import { WhoisData } from "./WhoisData";
import { ERRORS } from "../constants";
import { WhoisOptions, WhoisServer } from "../types"

class WhoisClient {
  protected getRandomProxyServer(): SocksProxy {
    const filePath = `${__dirname}/../free-proxy-list.json`
    const proxyFile = fs.readFileSync(filePath, "utf-8");

    const proxyList = JSON.parse(proxyFile);
    const randomProxyServer = proxyList[Math.floor(Math.random()*proxyList.length)];

    // console.log(randomProxyServer)

    return {
      ipaddress: randomProxyServer.ip,
      port: Number(randomProxyServer.port),
      type: 5
    }
  }

  protected getWhoisServer(domain: string): WhoisServer {
    const domainHelper = new DomainHelper()
    const sanitizedDomainName = domainHelper.sanitize(domain);
    const tld = sanitizedDomainName.split('.').pop()
    return (typeof whois.SERVERS[tld] === 'string') ? { host: whois.SERVERS[tld] } : whois.SERVERS[tld]
  }

  protected getOptions(domain: string, options: Partial<WhoisOptions>): WhoisOptions {
    if (!options.server) {
      options.server = this.getWhoisServer(domain)
    }

    if (!options.server) {
      options.server = {
        host: "whois.verisign-grs.com",
        port: 43,
        query: "$addr\r\n"
      }
    }

    if (!options.server.query) {
      options.server.query = "$addr\r\n"
    }

    if (!options.proxy) {
      options.proxy = this.getRandomProxyServer()
    }

    return {...options} as WhoisOptions
  }

  protected convertToJSON(rawData: string): object {
    let whoisData: WhoisData;
    let result: object | undefined;

    if (typeof rawData === 'object') {
      result = Object.fromEntries(Object.entries(rawData).map(([key, value]) => {
        if (typeof value === 'object' && value !== null && 'data' in value && typeof value.data === 'string') {
          whoisData = new WhoisData(value.data);
          const newValue = (value && typeof value === 'object' && value.hasOwnProperty('data')) ? {...value, data: whoisData.parse().getParsed()} : value;
          return [key, newValue];
        }
        return [key, value];
      }));
    } else {
      whoisData = new WhoisData(rawData)
      result = whoisData.parse().getParsed() ?? {};
    }

    if (Object.keys(result).length === 0) {
      // console.log(rawData)
      throw new Error(ERRORS.WhoisResponseEmpty)
    }

    return result
  }

  protected async defaultConnection(domain: string, options: WhoisOptions): Promise<string> {
    // console.log(':: Default connection')

    const lookup = util.promisify(whois.lookup);

    if (!options.server) {
      options.server = this.getWhoisServer(domain)
    }

    const updatedOptions = Object.keys(options).filter(key => key !== 'proxy');

    let rawData: string = ''
    try {
      rawData = await lookup(domain, updatedOptions)
    } catch (e: any) {
      throw new Error(`Failed to connect via the default connection: ${e.message}`)
    }

    return rawData
  };

  protected async alternativeConnection(domain: string, options: WhoisOptions): Promise<string> {
    // console.log(':: Alternative connection')

    const client = new net.Socket();

    const query = options.server.query.replace('$addr', domain)

    return new Promise((resolve, reject) => {
      client.connect(options.server.port, options.server.host, () => {
        client.write(query);
      });

      client.on('data', data => {
        resolve(data.toString());
        client.destroy();
      });

      client.on('error', e => {
        throw new Error(`Failed to connect via the alternative connection: ${e.message}`)
      });
    });
  };

  protected async proxyConnection(domain: string, options: WhoisOptions): Promise<string> {
    // console.log(':: Proxy connection')

    // https://proxylist.geonode.com/api/proxy-list?limit=500&page=1&sort_by=lastChecked&sort_type=desc&filterUpTime=90&country=BR&speed=fast&protocols=socks5
    // https://geonode.com/free-proxy-list
    // https://github.com/JoshGlazebrook/socks/
    // http://www.ietf.org/rfc/rfc1928.txt
    // https://www.rfc-editor.org/rfc/rfc3912.txt#:~:text=WHOIS%20is%20a%20TCP%2Dbased,information%20services%20to%20Internet%20users.

    const socketOptions: SocksClientOptions = {
      proxy: {
        ipaddress: options.proxy.ipaddress || '', // Random public proxy
        port: options.proxy.port,
        type: 5
      },
      destination: {
        host: options.server.host, // can be an ip address or domain (4a and 5 only)
        port: options.server.port || 43
      },
      // SOCKS Connection Type (Optional)
      // - defaults to 'connect'
      // 'connect'    - establishes a regular SOCKS connection to the target host.
      // 'bind'       - establishes an open tcp port on the SOCKS for another client to connect to.
      // 'associate'  - establishes a udp association relay on the SOCKS server.
      command: 'connect' // This defaults to connect, so it's optional if you're not using BIND or Associate.
    };

    let info: SocksClientEstablishedEvent
    try {
      // console.log(socketOptions)
      info = await SocksClient.createConnection(socketOptions)
      // console.log(info)
    } catch (e: any) {
      throw new Error(`Failed to connect to proxy ${socketOptions.proxy.ipaddress}: ${e.message}`)
    }

    return new Promise((resolve, reject) => {
      try {
        // console.log(info.socket.remoteAddress)

        info.socket.setEncoding('utf8');
        info.socket.setTimeout(5000);
        info.socket.on('timeout', () => {
          info.socket.end();
        });

        const query = options.server.query.replace('$addr', domain)

        // console.log(socketOptions.destination.query, query, domain)

        // Connection has been established, we can start sending data now:
        info.socket.write(query);
        info.socket.on('data', function (data) {
          // console.log(data.length);
          // console.log(data);
          resolve(data.toString());
        });
        info.socket.on('end', () => {
          info.socket.end()
        })
      } catch (e) {
        throw new Error(`Failed to connect to ${socketOptions.destination.host}`)
      }
    })
  }

  protected optionsHasProxy(options: Partial<WhoisOptions>): boolean {
    return !! (
      options.proxy
      && (options.proxy.host || options.proxy.ipaddress)
      && options.proxy.port
    )
  }

  public async query(domain: string, options: Partial<WhoisOptions> = {}) {
    const domainHelper = new DomainHelper()
    const sanitizedDomainName = domainHelper.sanitize(domain);
    let response: any

    let defaultConnectionTypes = ['default', 'alternative']
    const updatedOptions = this.getOptions(domain, options)
    if (options.wantsFreeProxy || this.optionsHasProxy(options)) {
      defaultConnectionTypes.push('proxy')
    }
    let testOrder = options.use ? [options.use] : defaultConnectionTypes

    // console.log(testOrder)

    let i;
    for(i = 0; i < testOrder.length; i++) {
      response = await this.connectVia(testOrder[i], sanitizedDomainName, updatedOptions)
        .catch(e => console.error)

      const validResponse = typeof response === "object" && Object.keys(response).length > 0
      if (validResponse) {
        break
      }
    }

    console.log(`:: [${new Date().toISOString()}] Domain ${sanitizedDomainName} retrieved with ${testOrder[i]}Connection.`)
    return response
  }

  protected async connectVia(type: string, domain: string, options: WhoisOptions): Promise<object> {
    let jsonResponse = {}
    try {
      // @ts-ignore
      const rawData = await this[`${type.toLowerCase()}Connection`](domain, options)
      jsonResponse = this.convertToJSON(rawData)
      if (typeof jsonResponse === "object" && Object.keys(jsonResponse).length === 0) {
        throw new Error(`\n${ERRORS.WhoisResponseEmpty}`)
      }
    } catch (e: any) {
      throw new Error(`\n${type.toUpperCase()}: ${ERRORS.WhoisError}: ${e.message}`)
    }
    return jsonResponse
  }
}

export { WhoisClient }
