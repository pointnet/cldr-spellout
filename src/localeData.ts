import type { IRBNFData } from "./types.js";

import af from "cldr-rbnf/rbnf/af.json";
import ak from "cldr-rbnf/rbnf/ak.json";
import am from "cldr-rbnf/rbnf/am.json";
import ar from "cldr-rbnf/rbnf/ar.json";
import az from "cldr-rbnf/rbnf/az.json";
import be from "cldr-rbnf/rbnf/be.json";
import bg from "cldr-rbnf/rbnf/bg.json";
import bs from "cldr-rbnf/rbnf/bs.json";
import ca from "cldr-rbnf/rbnf/ca.json";
import ccp from "cldr-rbnf/rbnf/ccp.json";
import chr from "cldr-rbnf/rbnf/chr.json";
import cs from "cldr-rbnf/rbnf/cs.json";
import cy from "cldr-rbnf/rbnf/cy.json";
import da from "cldr-rbnf/rbnf/da.json";
import de from "cldr-rbnf/rbnf/de.json";
import deCH from "cldr-rbnf/rbnf/de-CH.json";
import ee from "cldr-rbnf/rbnf/ee.json";
import el from "cldr-rbnf/rbnf/el.json";
import en from "cldr-rbnf/rbnf/en.json";
import enIN from "cldr-rbnf/rbnf/en-IN.json";
import eo from "cldr-rbnf/rbnf/eo.json";
import es from "cldr-rbnf/rbnf/es.json";
import es419 from "cldr-rbnf/rbnf/es-419.json";
import et from "cldr-rbnf/rbnf/et.json";
import fa from "cldr-rbnf/rbnf/fa.json";
import faAF from "cldr-rbnf/rbnf/fa-AF.json";
import ff from "cldr-rbnf/rbnf/ff.json";
import fi from "cldr-rbnf/rbnf/fi.json";
import fil from "cldr-rbnf/rbnf/fil.json";
import fo from "cldr-rbnf/rbnf/fo.json";
import fr from "cldr-rbnf/rbnf/fr.json";
import frBE from "cldr-rbnf/rbnf/fr-BE.json";
import frCH from "cldr-rbnf/rbnf/fr-CH.json";
import ga from "cldr-rbnf/rbnf/ga.json";
import gu from "cldr-rbnf/rbnf/gu.json";
import he from "cldr-rbnf/rbnf/he.json";
import hi from "cldr-rbnf/rbnf/hi.json";
import hr from "cldr-rbnf/rbnf/hr.json";
import hu from "cldr-rbnf/rbnf/hu.json";
import hy from "cldr-rbnf/rbnf/hy.json";
import id from "cldr-rbnf/rbnf/id.json";
import is from "cldr-rbnf/rbnf/is.json";
import it from "cldr-rbnf/rbnf/it.json";
import ja from "cldr-rbnf/rbnf/ja.json";
import ka from "cldr-rbnf/rbnf/ka.json";
import kk from "cldr-rbnf/rbnf/kk.json";
import kl from "cldr-rbnf/rbnf/kl.json";
import km from "cldr-rbnf/rbnf/km.json";
import ko from "cldr-rbnf/rbnf/ko.json";
import ky from "cldr-rbnf/rbnf/ky.json";
import lb from "cldr-rbnf/rbnf/lb.json";
import lo from "cldr-rbnf/rbnf/lo.json";
import lrc from "cldr-rbnf/rbnf/lrc.json";
import lt from "cldr-rbnf/rbnf/lt.json";
import lv from "cldr-rbnf/rbnf/lv.json";
import mk from "cldr-rbnf/rbnf/mk.json";
import ms from "cldr-rbnf/rbnf/ms.json";
import mt from "cldr-rbnf/rbnf/mt.json";
import my from "cldr-rbnf/rbnf/my.json";
import ne from "cldr-rbnf/rbnf/ne.json";
import nl from "cldr-rbnf/rbnf/nl.json";
import nn from "cldr-rbnf/rbnf/nn.json";
import no from "cldr-rbnf/rbnf/no.json";
import pl from "cldr-rbnf/rbnf/pl.json";
import pt from "cldr-rbnf/rbnf/pt.json";
import ptPT from "cldr-rbnf/rbnf/pt-PT.json";
import qu from "cldr-rbnf/rbnf/qu.json";
import ro from "cldr-rbnf/rbnf/ro.json";
import ru from "cldr-rbnf/rbnf/ru.json";
import se from "cldr-rbnf/rbnf/se.json";
import sk from "cldr-rbnf/rbnf/sk.json";
import sl from "cldr-rbnf/rbnf/sl.json";
import sq from "cldr-rbnf/rbnf/sq.json";
import sr from "cldr-rbnf/rbnf/sr.json";
import srLatn from "cldr-rbnf/rbnf/sr-Latn.json";
import su from "cldr-rbnf/rbnf/su.json";
import sv from "cldr-rbnf/rbnf/sv.json";
import sw from "cldr-rbnf/rbnf/sw.json";
import ta from "cldr-rbnf/rbnf/ta.json";
import th from "cldr-rbnf/rbnf/th.json";
import tr from "cldr-rbnf/rbnf/tr.json";
import uk from "cldr-rbnf/rbnf/uk.json";
import und from "cldr-rbnf/rbnf/und.json";
import vec from "cldr-rbnf/rbnf/vec.json";
import vi from "cldr-rbnf/rbnf/vi.json";
import yue from "cldr-rbnf/rbnf/yue.json";
import yueHans from "cldr-rbnf/rbnf/yue-Hans.json";
import zh from "cldr-rbnf/rbnf/zh.json";
import zhHant from "cldr-rbnf/rbnf/zh-Hant.json";

// `as unknown` is required because TypeScript infers JSON tuple entries as
// `string[][]` (variable-length arrays) rather than `[string, string][]`
// (the fixed-length pair that IRBNFData expects). The types don't overlap
// enough for a direct cast, so we go through `unknown` first.
export const localeData = {
  af,
  ak,
  am,
  ar,
  az,
  be,
  bg,
  bs,
  ca,
  ccp,
  chr,
  cs,
  cy,
  da,
  de,
  "de-CH": deCH,
  ee,
  el,
  en,
  "en-IN": enIN,
  eo,
  es,
  "es-419": es419,
  et,
  fa,
  "fa-AF": faAF,
  ff,
  fi,
  fil,
  fo,
  fr,
  "fr-BE": frBE,
  "fr-CH": frCH,
  ga,
  gu,
  he,
  hi,
  hr,
  hu,
  hy,
  id,
  is,
  it,
  ja,
  ka,
  kk,
  kl,
  km,
  ko,
  ky,
  lb,
  lo,
  lrc,
  lt,
  lv,
  mk,
  ms,
  mt,
  my,
  ne,
  nl,
  nn,
  no,
  pl,
  pt,
  "pt-PT": ptPT,
  qu,
  ro,
  ru,
  se,
  sk,
  sl,
  sq,
  sr,
  "sr-Latn": srLatn,
  su,
  sv,
  sw,
  ta,
  th,
  tr,
  uk,
  und,
  vec,
  vi,
  yue,
  "yue-Hans": yueHans,
  zh,
  "zh-Hant": zhHant,
} as unknown as Record<string, IRBNFData>;
