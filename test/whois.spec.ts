// @ts-ignore
import assert from "assert";
import { whoisClient } from "../src";
import { ERRORS } from "../src/constants";
import { dedent } from 'ts-dedent';
import { WhoisData } from "../src/libraries/WhoisData";
import { WhoisClient } from "../src/libraries/WhoisClient";
// @ts-ignore
import whois from "whois";
import {SocksProxyType} from "socks/typings/common/constants";

const delayMs = async (milliseconds: number, steps: number = 10) => {
    for (let i = 1; i <= steps; i++) {
        let dots = new Array(i + 1).join(".");
        let spaces = new Array(steps + 1 - i).join(" ");

        if (process.stdout.isTTY) {
            process.stdout.cursorTo(0)
            process.stdout.clearLine(0)
        }
        process.stdout.write(`Waiting [${dots}${spaces}]`)

        await new Promise(resolve => setTimeout(resolve, Math.round(milliseconds / steps)));
    }
    process.stdout.write("\n");
}

describe("whois", function() {
    this.timeout(120000)

    describe("whois VPN", function () {
        beforeEach( async function() {
            console.log(`:: waiting 60s for next test (protects from being blacklisted by Whois servers) [${this.currentTest?.title}]`);
            await delayMs(60000)
        })

        it("should find microsoft.com.br using VPN", async function() {
            const domain = "microsoft.com.br"

            const whoisClient = new WhoisClient()
            // https://www.freeproxy.world/?type=socks5&anonymity=&country=BR&speed=1200&port=&page=1
            const proxyServer = {
                ipaddress: '168.196.160.61',
                port: 59166,
                type: 5 as SocksProxyType
            }

            const response = await whoisClient.query(domain, { use: "proxy", proxy: proxyServer });
            // console.log(response)
            assert.ok(response);
            // assert.strictEqual(response?.domainName?.toLowerCase(), "google.com");

						console.log(response);
						console.log(new WhoisData(response).buildResponse());
        });
    })

    describe("whois real tests", () => {
        beforeEach(async function() {
            console.log(`:: waiting 60s for next test (protects from being blacklisted by Whois servers) [${this.currentTest?.title}]`);
            await delayMs(60000)
        })

        it("should find google.com successfully", async () => {
            const response = await whoisClient("google.com");
            assert.ok(response);
            assert.strictEqual(response?.domainName?.toLowerCase(), "google.com");

						console.log(response);
						console.log(new WhoisData(response).buildResponse());
        });

        it("should work with the protocol prefix", async () => {
            const response = await whoisClient("https://google.com");
            assert.ok(response);
            assert.strictEqual(response?.domainName?.toLowerCase(), "google.com");

						console.log(response);
						console.log(new WhoisData(response).buildResponse());
					});

        it("should find mwguerra.com successfully", async () => {
            const response = await whoisClient("mwguerra.com");
            assert.ok(response);
            assert.strictEqual(response?.domainName?.toLowerCase(), "mwguerra.com");

						console.log(response);
						console.log(new WhoisData(response).buildResponse());
					});

        it("should find likker.com.br successfully", async () => {
            const response = await whoisClient("https://likker.com.br");
            assert.ok(response);
            assert.strictEqual(response?.domain?.toLowerCase(), "likker.com.br");

						console.log(response);
						console.log(new WhoisData(response).buildResponse());
					});

        it("should fail to lookup a top level domain that does not exist", async () => {
            try {
                await whoisClient("domain.invalidTopLevelDomain");
            } catch (error: any) {
                assert.strictEqual(error.message, ERRORS.WhoisResponseEmpty);
            }
        });

        it("should fail to lookup because there was no domain provided", async () => {
            try {
                await whoisClient("");
            } catch (error: any) {
                assert.strictEqual(error.message, ERRORS.NoDomainError);
            }
        });
    });
})
