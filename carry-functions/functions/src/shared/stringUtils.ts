
const isNullOrEmpty =  function (text: string | undefined | null){
    return text === undefined || text === null || text.trim() === ''
}

export default {
    isNullOrEmpty
}