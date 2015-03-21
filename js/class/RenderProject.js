/**
 * Created by Guillaume on 14/03/2015.
 */
RenderP = function () {
    this.tracks = currentProject.tabListTracks;
    this.nextElement = null;
    this.elementEnd = null;
    this.commands = [];
    this.commandTracksAudio = [];
    this.commandTracksVideo = [];
    this.commandList = [];

    this.t = 0;
    for (t = 0; t < this.tracks.length; t++) {
        this.t = t;
        this.tracks[t].tabElements.sort(function (a, b) {
            console.log("tris");
            return a.marginLeft - b.marginLeft
        }); //sort pour avoir les element dans le bon ordre des marges

        this.commands.push([]);

        this.elementInTrack = this.tracks[t].tabElements;

        console.log("track ", t, "elementT", this.elementInTrack);

        for (var e = 0; e < this.elementInTrack.length; e++) {
            console.log("element n°", e);

            if (e == 0) {
                console.log("0 -> deb");
                if (this.elementInTrack[e].marginLeft != 0) {
                    var cmd;
                    cmd = (this.tracks[t].type == TYPE.AUDIO) ? "-ar 48000 -f s16le -acodec pcm_s16le -ac 2 -i /dev/zero -acodec libmp3lame -aq 4 -t " + Math.ceil(this.elementInTrack[e].marginLeft / oneSecond) + " -y " + this.commands[this.t].length + ".mp3" :"-loop 1 -f image2 -c:v png -i black.png -i sample.wav -map 0:v -map 1:a -t " + Math.ceil(this.elementInTrack[e].marginLeft / oneSecond) + " -s 1280x720 -c:v mpeg4 -c:a libmp3lame  -pix_fmt yuv420p -y " + this.commands[this.t].length + ".mp4";
                    this.commandList.push(cmd);
                    this.commands[t].push(cmd);

                }

                (this.tracks[t].type == TYPE.AUDIO) ? this.addCommandA(this.elementInTrack[e]) : this.addCommandV(this.elementInTrack[e]);
                ((this.elementInTrack.length-1) != e)?((this.tracks[t].type == TYPE.AUDIO) ? this.addBlackA(e) : this.addBlackV(e)):null;

            }
            else if ( e == (this.elementInTrack.length - 1) ) {
                (this.tracks[t].type == TYPE.AUDIO) ? this.addCommandA(this.elementInTrack[e]) : this.addCommandV(this.elementInTrack[e]);
            }
            else {
                (this.tracks[t].type == TYPE.AUDIO) ? this.addCommandA(this.elementInTrack[e]) : this.addCommandV(this.elementInTrack[e]);
                (this.tracks[t].type == TYPE.AUDIO) ? this.addBlackA(e) : this.addBlackV(e);
            }

        }

        if (this.tracks[t].tabElements.length > 0) {
            var lastCmd = '';
            var complexfliter = '-filter_complex \'';
            var ending = (this.tracks[t].type == TYPE.AUDIO) ? "concat=n=" + this.commands[t].length + ":v=0:a=1:unsafe=1 [a]\' -map \'[a]\' -y" : "concat=n=" + this.commands[t].length + ":v=1:a=1:unsafe=1 [v] [a]\' -map \'[v]\' -map \'[a]\' -aspect 16:9 -s 1280x720 -c:v mpeg4 -c:a libmp3lame -y";
            for (i = 0, a=1; i < this.commands[t].length; i++, a++) {
                lastCmd += (this.tracks[t].type == TYPE.AUDIO) ? '-i ' + a + '.mp3 ' : '-i ' + a + '.mp4 ';
                complexfliter += (this.tracks[t].type == TYPE.AUDIO) ? '[' + i + ':0]' : '[' + i + ':0][' + i + ':1]';
            }
            lastCmd += complexfliter;
            lastCmd += ending;
            lastCmd += (this.tracks[t].type == TYPE.AUDIO) ? " track_" + t + ".mp3" : " track_" + t + ".mp4";
            (this.tracks[t].type == TYPE.AUDIO) ? this.commandTracksAudio.push([t, lastCmd]) : this.commandTracksVideo.push([t, lastCmd]);
            this.commands[t].push(lastCmd);
            this.commandList.push(lastCmd);
        }
    }

    var finalAudio = "audio.mp3";
    // Merge audio tracks into single one
    if (this.commandTracksAudio.length>1)
    {
        var cmd ="" ;
        for (i=0;i<this.commandTracksAudio.length;i++)
        {
            var trackId = this.commandTracksAudio[i][0];
            cmd += "-i track_"+trackId+".mp3 ";
        }
        cmd += "amix=inputs="+this.commandTracksAudio.length+":duration=longest:dropout_transition=2 audio.mp3";
        this.commandList.push(cmd);
        finalAudio = "audio.mp3";
    }
    else
    {
        finalAudio = "track_1.mp3";
    }


    // merge audio and video

    //Upload the command File
    this.commandList.push("-i track_0.mp4 "+((this.commandTracksAudio.length>0)?"-i "+finalAudio:"")+" -map 0:v "+((this.commandTracksAudio.length>0)?"-map 1:a":"")+" -s 1280x720 -c:v mpeg4 -c:a libmp3lame final.mp4")
    this.uploadCommands();
};
RenderP.prototype.addCommandV = function (e) {
    this.elementEnd = e.marginLeft + e.width
    var curentFileforElement = this.getFileInformationById(e.fileId)

    if (curentFileforElement.type == TYPE.IMAGE || curentFileforElement.type == TYPE.TEXT) {
        var codec = "";
        switch (curentFileforElement.format) {
            case "png":
                codec = "png";
                break
            case "bmp":
                codec = "bmp";
                break
            case "jpeg":
                codec = "mjpeg";
                break
            case "jpg":
                codec = "mjpeg";
                break
        }
        this.commands[this.t].push("-loop 1 -c:v " + codec + " -i FILE_" + e.fileId + ".data -i sample.wav -map 0:v -map 1:a -t " + (Math.ceil((e.width - e.rightGap) / oneSecond)) + " -s 1280x720 -c:v mpeg4 -c:a libmp3lame  -pix_fmt yuv420p -y " + this.commands[this.t].length + ".mp4");
        this.commandList.push("-loop 1 -c:v " + codec + " -i FILE_" + e.fileId + ".data -i sample.wav -map 0:v -map 1:a -t " + (Math.ceil((e.width - e.rightGap) / oneSecond)) + " -s 1280x720 -c:v mpeg4 -c:a libmp3lame  -pix_fmt yuv420p -y " + this.commands[this.t].length + ".mp4");
    }
    else
        {
        this.commands[this.t].push("-i FILE_" + e.fileId + ".data -i sample.wav -map 0:v -map 1:a -t " + (Math.ceil((e.width - e.rightGap) / oneSecond)) + " -s 1280x720 -c:v mpeg4 -c:a libmp3lame -y " + this.commands[this.t].length + ".mp4");
        this.commandList.push("-i FILE_" + e.fileId + ".data -i sample.wav -map 0:v -map 1:a -t " + (Math.ceil((e.width - e.rightGap) / oneSecond)) + " -s 1280x720 -c:v mpeg4 -c:a libmp3lame -y " + this.commands[this.t].length + ".mp4");
    }


};

RenderP.prototype.addCommandA = function (e) {
    this.elementEnd = e.marginLeft + e.width

    var curentFileforElement = this.getFileInformationById(e.fileId)

    this.commands[this.t].push("-ss " + (e.leftGap / oneSecond) + " -i FILE_" + e.fileId + ".data -t " + (Math.ceil((e.width - e.rightGap) / oneSecond)) + " -y " + this.commands[this.t].length + ".mp3");
    this.commandList.push("-ss " + (e.leftGap / oneSecond) + " -i FILE_" + e.fileId + ".data -t " + (Math.ceil((e.width - e.rightGap) / oneSecond)) + " -y " + this.commands[this.t].length + ".mp3");

};

RenderP.prototype.addBlackV = function (e) {
    tempIndex = e;
    tempIndex++;
    if (!(tempIndex > this.elementInTrack.length)) {
        this.nextElement = this.elementInTrack[tempIndex];
        if (this.nextElement.marginLeft == this.elementEnd) {
            //fileContent += "\n element+1 sticked !";
            console.log("sticked");
        }
        else {
            console.log("black from ", this.elementEnd, "to ", this.nextElement.marginLeft);
            this.commands[this.t].push("-loop 1 -c:v png -i black.png -i sample.wav -map 0:v -map 1:a -t " + Math.ceil((this.nextElement.marginLeft - this.elementEnd) / oneSecond) + " -s 1280x720 -c:v mpeg4 -c:a libmp3lame  -pix_fmt yuv420p -y " + this.commands[this.t].length + ".mp4");
            this.commandList.push("-loop 1 -c:v png -i black.png -i sample.wav -map 0:v -map 1:a -t " + Math.ceil((this.nextElement.marginLeft - this.elementEnd) / oneSecond) + " -s 1280x720 -c:v mpeg4 -c:a libmp3lame  -pix_fmt yuv420p -y " + this.commands[this.t].length + ".mp4");
        }
    }
};

RenderP.prototype.addBlackA = function (e) {
    tempIndex = e;
    tempIndex++;
    if (!(tempIndex > this.elementInTrack.length)) {
        this.nextElement = this.elementInTrack[tempIndex];
        if (this.nextElement.marginLeft == this.elementEnd) {
            //fileContent += "\n element+1 sticked !";
            console.log("sticked");
        }
        else {
            console.log("black from ", this.elementEnd, "to ", this.nextElement.marginLeft);
            this.commands[this.t].push("-ar 48000 -f s16le -acodec pcm_s16le -ac 2 -i /dev/zero -acodec libmp3lame -aq 4 -t " + Math.ceil((this.nextElement.marginLeft - this.elementEnd) / oneSecond) + " -y " + this.commands[this.t].length + ".mp3");
            this.commandList.push("-ar 48000 -f s16le -acodec pcm_s16le -ac 2 -i /dev/zero -acodec libmp3lame -aq 4 -t " + Math.ceil((this.nextElement.marginLeft - this.elementEnd) / oneSecond) + " -y " + this.commands[this.t].length + ".mp3");
        }
    }
};

RenderP.prototype.getFileInformationById = function (id) {
    for (i = 0; i < currentProject.tabListFiles.length; i++) {
        if (currentProject.tabListFiles[i].id == id) {
            var file = currentProject.tabListFiles[i];
        }
    }
    return file;
}
RenderP.prototype.uploadCommands = function(){
    var finalString = "";

    for (i=0;i<this.commandList.length;i++)
    {
        finalString += this.commandList[i];
        if (i!= this.commandList.length-1)
        {
            finalString += "\n"
        }
    }

    var txtFile = new Blob([finalString], {type:'text/plain', name:"command.ffm"});
    uploadFile(-1,"renderFile", txtFile, "RENDER");
}