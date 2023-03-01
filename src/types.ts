import {SocksProxy, SocksRemoteHost} from "socks/typings/common/constants";

export interface WhoisServer extends SocksRemoteHost {
  query: string;
}

export interface WhoisOptions {
  server: WhoisServer
  proxy: SocksProxy
  use?: 'default' | 'alternative' | 'proxy'
  wantsFreeProxy?: boolean
}
