export function checkDate(string) {
  // https://regex101.com/r/TDXECk/1
  const regex = /^(((0[1-9]|1[012])[-\/]([012][0-9]|3[012])[-\/]([12][0-9]{3}))|(([012][0-9]|3[012])[-\/](0[1-9]|1[012])[-\/][12][0-9]{3})|(([12][0-9]{3})[-\/](0[1-9]|1[012])[-\/]([012][0-9]|3[012])))($|(\s|[A-Z])(([01][0-9]|2[0-3])(:[0-5][0-9]){2}).[0-9]{3})$/g
  (regex.test(string)) ? true : false
}

export function csvToJSON (data, delimiter = ',') {
  const csv = data.replace(/"/g, '')
  const titles = csv.slice(0, csv.indexOf('\n')).split(delimiter)
  return csv
    .slice(csv.indexOf('\n')+1)
    .split('\n')
    .map(v => {
      const values = v.split(delimiter)
      const json = titles.reduce((obj, title, index) => {
        return (obj[title] = toNumber(values[index])), obj
      } , {})
      
      return json
    })
    
    .filter( (row) => {
      delete row._id
      delete row._index
      delete row._score
      delete row._type
      return row
    }) 
}

export function flattenObj (obj, prefix = '') {
  return Object.keys(obj).map( (row) => row).reduce( (acc, curr) => {
    const pref = prefix.length ? prefix + '_' : ''
    if ( typeof obj[curr] !== 'object' || obj[curr] === null) {
      return  {...acc, ...{ [pref + curr]: obj[curr] }}
    }
    const depth = flatten(obj[curr], pref + curr)
    return { ...acc, ...depth }
  }, {})
}

export function formatDate(str) {
  //date format MMM dd YY
  const regex = /^([A-Z a-z]{3})\W+(0?[0-9]|[1-2][0-9]|3[0-1])(\W|,\s)([0-9]{4})((\s\W\s))((?:(0[0-9]|1[0-9]|2[0-3]))(?:(:[0-5][0-9])){2}).([0-9]{3})/gm
  if (str !== undefined)
  return str.replace(regex, ($ ,p1, p2, p3, p4, p5, p6, p7,p8,p9,p10, decal, chaine) => {
    //console.log('date :>> ', `${p4}/${p1}/0${p2} ${p7}`);
    if (p2 < 10 &&  p2.length < 2) 
      return new Date(`${p4}/${p1}/0${p2} ${p7}`).toISOString()
    return new Date(`${p4}/${p1}/${p2} ${p7}`).toISOString()
  })
}

export const MergeObject = (item) => item.reduce( (a, b) => ({ ...a, ...b }) )

export function toNumber(str) {
  const regex = /(\d+|Infinity)/gm
  if( regex.test(str) && isNaN(Number(str)) && typeof str === 'string' ){
    const replacer = str.replace(/,/g, '')
    return Number(replacer)
  }
  return str
}
