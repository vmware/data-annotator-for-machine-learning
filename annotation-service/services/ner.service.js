
/***
 * 
 * Copyright 2019-2021 VMware, Inc.
 * SPDX-License-Identifier: Apache-2.0
 * 
***/


const axios = require("axios");
const config = require("../config/config");
const { PROJECTTYPE } = require("../config/constant");


async function gainNERtokens(tickes, projectType, token){
  
  if (PROJECTTYPE.NER != projectType) return tickes;
  
  let data = []
  tickes.forEach(tickt => {
    const ot = {text: Object.values(tickt.originalData).toString()};
    data.push(ot);
  });

  const options = {headers: { 'Content-Type': 'application/json', Authorization: token }};
  let res = await axios.post(`${config.loopALApiUrl}/ner/user-tokens`, {"data": data}, options);

  if(res.data.status == 'ERROR') return res.data;
 
  res.data.data.forEach((token, i) =>{
    tickes[i].originalData = token;
  });

  return tickes;

}


module.exports={
  gainNERtokens,
}