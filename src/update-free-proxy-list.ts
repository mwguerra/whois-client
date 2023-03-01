import axios from "axios";
import fs from "fs";

(async () => {
  const dataUrl = 'https://proxylist.geonode.com/api/proxy-list?limit=500&page=1&sort_by=lastChecked&sort_type=desc&filterUpTime=90&country=BR&speed=fast&protocols=socks5'
  const { data } = await axios(dataUrl);
  if (data && data.data) {
    fs.writeFileSync('./src/free-proxy-list.json', JSON.stringify(data.data));
    console.log(`'free-proxy-list.json' file updated successfully`);
  } else {
    console.error(`Free proxy list update: There was an error saving the file.`);
  }
  process.exit();
})();
