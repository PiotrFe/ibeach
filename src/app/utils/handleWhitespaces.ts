export const decodeWhitespaces = (str: string): string => {
  return str.replace(/%0D%0A/g, '\n');
};

export const encodeWhitespaces = (str: string): string => {
  return str.replace(/\n/g, '%0D%0A');
};

// export const addWhitespaces = (value: string): string => {
//   return value.replace(/\[\d+nl\]/g, (str) => {
//     const intArr = str.match(/\d+(?=nl\])/g);
//     if (intArr?.length === 1) {
//       let replacementCount = parseInt(intArr[0]);
//       let returnStr = '';

//       for (let i = 1; i <= replacementCount; i++) {
//         returnStr += '%0D%0A';
//       }

//       return returnStr;
//     }
//     return value;
//   });
// };
