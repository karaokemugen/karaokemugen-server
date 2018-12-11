import {deburr} from "lodash"

function normalizeString(str,keepcoma=false) {
  if(str)
  {
    str = deburr(str);
    str = str.toLowerCase();
    return str
      .replace(keepcoma ? new RegExp(/[/&?'"% \t]/ig) : new RegExp(/[/&?"'% \t,]/ig),"-")
      .replace(new RegExp(/-+/g),"-")
      .replace(new RegExp(/^-/),"")
      .replace(new RegExp(/-$/),"")
  }
  return '';
}

export default normalizeString;