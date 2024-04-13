// offset debe estar en minutos, y debe ser la diferencia de minutos a UTC
function getOffsetString(offset) {
    if (offset == 0) {
        return 'Z';
    }
    else if (offset > 0) {
        let minute_offset = `${offset % 60}`;
        if (minute_offset.length < 2) { minute_offset = '0' + minute_offset; }

        if (offset < 60) {
            return `+00:${minute_offset}`;
        }
        else {
            let hour_offset = `${Math.floor(offset / 60)}`;
            if (hour_offset.length < 2) { hour_offset = '0' + hour_offset; }
            return `+${hour_offset}:${minute_offset}`;
        }
    }
    else if (offset < 0) {
        let minute_offset = `${offset % 60}`;
        if (minute_offset.length < 2) { minute_offset = '0' + minute_offset; }

        if (offset > -60) {
            return `-00:${minute_offset}`; 
        }
        else {
            let hour_offset = `${Math.ceil(offset / 60)}`;
            if (hour_offset.length < 2) { hour_offset = '0' + hour_offset; }
            return `${hour_offset}:${minute_offset}`;
        }
    }
}

module.exports = getOffsetString;