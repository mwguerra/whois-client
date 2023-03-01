# whois-client

A Whois client for Node.js built with typescript to lookup domain information.

## Installation

Install via NPM

```bash
npm i @mwguerra/whois-client --save
```

or install via Yarn
```bash
yarn add @mwguerra/whois-client
```

## Usage in code

Import the package and use it!

Javascript example:
```javascript
// Javascript
const whoisClient = require("@mwguerra/whois-client")

async function whoisLookup(hostname) {
  return await whoisClient(hostname)
}

whoisLookup("https://www.google.com")
```

Typescript example:
```typescript
// Typescript
import whoisClient from "@mwguerra/rdap-client"

const whoisLookup = async (hostname) => await whoisClient(hostname)

whoisLookup("https://www.google.com")
```

## Usage in CLI

```bash
$ yarn whois-client https://google.com
```
or
```bash
$ npm run whois-client https://google.com
```


## Usage in CLI (as global)

1. Install via `npm i whois-client -g` or `yarn global add whois-client`

2. Execute on your terminal

```bash
$ whois-client https://www.google.com
```

## Response

The Whois response will be a JSON representation of the Whois server response. Since Whois does not have a standard response type, key names depends on the server implementation.
For example, the domain name could be either at the "domainName" key (usually at .com top level domains) or at the "domain" key (usually at .com.br top level domains).

If you want to understand how parsing was done, please have a look at the [WhoisData.ts](https://github.com/mwguerra/whois-client/blob/master/src/libraries/WhoisData.ts) file.

<details>
<summary>Example Response</summary>
<p>

```jsonc
{
  domainName: 'GOOGLE.COM',
  registryDomainId: '2138514_DOMAIN_COM-VRSN',
  registrarWhoisServer: 'whois.markmonitor.com',
  registrarUrl: 'http://www.markmonitor.com',
  updatedDate: '2019-09-09T15:39:04Z',
  creationDate: '1997-09-15T04:00:00Z',
  registryExpiryDate: '2028-09-14T04:00:00Z',
  registrar: 'MarkMonitor Inc.',
  registrarIanaId: '292',
  registrarAbuseContactEmail: 'abusecomplaints@markmonitor.com',
  registrarAbuseContactPhone: '+1.2086851750',
  domainStatus: 'clientDeleteProhibited https://icann.org/epp#clientDeleteProhibited clientTransferProhibited https://icann.org/epp#clientTransferProhibited clientUpdateProhibited https://icann.org/epp#clientUpdateProhibited serverDeleteProhibited https://icann.org/epp#serverDeleteProhibited serverTransferProhibited https://icann.org/epp#serverTransferProhibited serverUpdateProhibited https://icann.org/epp#serverUpdateProhibited',
  nameServer: 'NS1.GOOGLE.COM NS2.GOOGLE.COM NS3.GOOGLE.COM NS4.GOOGLE.COM',
  dnssec: 'unsigned',
  urlOfTheIcannWhoisInaccuracyComplaintForm: 'https://www.icann.org/wicf/',
  lastUpdateOfWhoisDatabase: '2023-03-01T03:59:58Z',
  notice: 'The expiration date displayed in this record is the date the',
  termsOfUse: 'You are not authorized to access or query our Whois',
  byTheFollowingTermsOfUse: 'You agree that you may use this Data only',
  to: '(1) allow, enable, or otherwise support the transmission of mass'
}
```

</p>
</details>

## How does this work

* All calls are delayed by 60 seconds to reduce the chance of being blacklisted by Whois servers.
* Three connections will be tried (in that order):
  1. via the Whois package;
  2. directly to the server port 43;
  3. through a proxy connection, if a proxy server is available.

If no connection is available, it will throw an exception.

## Using a proxy

A proxy could be used to connect to the Whois database service. All you need to do is to provide the proxy connection information.

```jsonc
{
    proxy: {
        ipaddress: '123.456.789.012',
        port: 12345,
        type: 5
    }
    use: 'proxy'
}
```

* If you specify ```"use": "proxy"```, it will only try to reach the server using the proxy connection. Without the ```"use"``` key, the default behavior will be assumed (Whois package, port 43 and proxy connections in that order).
* The proxy type key refers to the SOCKS proxy type. At this time only SOCKS5 is available as the proxy server protocol.

## Free proxy list

Only for testing purposes, a free proxy list from [Geonode](https://geonode.com/free-proxy-list) is already available. Use it at your own risk. If you want to manually update the list, just run the command below.

```bash
$ npm run update:free-proxy-list
```

Besides being possible to use free proxy for the Whois requests, for security purposes, I strongly recommend using a good paid one.

## Credits

* This project makes use of the [whois](https://github.com/FurqanSoftware/node-whois) package by Furqan Software.

## License

MIT
