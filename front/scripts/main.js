const {createFFmpeg} = FFmpeg;

window.addEventListener("load", async () =>
{
    const fileInput = document.getElementById("video-input");
    const fileInputLabel = document.querySelector("[for = video-input]");
    const video = document.getElementsByTagName("video")[0];
    const videoContainer = document.getElementsByClassName("video-container")[0];
    const startEncoding = document.querySelector(".start-encoding");

    fileInput.onchange = async (event) =>
    {  
        videoContainer.classList.add('active');
        fileInputLabel.classList.remove('active');
        video.src = URL.createObjectURL(fileInput.files[0]);
        video.pause();
    }
    startEncoding.addEventListener('click', async (event) =>
    {
        video.pause();
        const videoContainer = document.querySelector('.video-container');
        const progressMain = document.querySelector('#progress');
        const progressBar = document.querySelector("#bar");
        const percentage = document.querySelector("#percentage");
        const startTimeDOM = document.querySelector('#time-start');
        const endTimeDOM = document.querySelector('#time-end');
        const qualityDOM = document.querySelector('#quality-checkbox')
        const start = startTimeDOM.value;
        const end = endTimeDOM.value ;
        
        const arrStart = start.split(':');
        const arrEnd = end.split(':');
        const duration = (parseInt(arrEnd[0])*3600 + parseInt(arrEnd[1]) * 60 + parseInt(arrEnd[2])) - (parseInt(arrStart[0])*3600 + parseInt(arrStart[1]) * 60 + parseInt(arrStart[2]));
        

        const useSimple = qualityDOM.checked;
        let cutVideo;
        async function progressCallback(progress)
        {   
            if (!progress.time) return;
            const complete = parseFloat((progress.time / duration).toFixed(3));
            if (complete >= 1)
            {
                videoContainer.classList.add('active');
                progressMain.classList.remove('active');
                progressBar.style["width"] = "0.0%";
                percentage.textContent = "0.0%";
            }
            else if (complete * 100 + 1 <= 100)
            {
                progressBar.style["width"] = (complete * 100 + 1).toFixed(1) + "%";
                percentage.textContent = (complete * 100 + 1).toFixed(1) + "%";
            }
        }
        if (duration <= 0) 
        {
            alert(`Поле 'ОБРЕЗАТЬ ДО' должно быть строго больше поля 'ОБРЕЗАТЬ С'`);
            return;
        }
        
        videoContainer.classList.remove('active');
        progressMain.classList.add('active');
        if (useSimple) cutVideo = await executeFFmpegCommand(fileInput.files[0], `-ss ${start} -to ${end} -i input.mp4 -vcodec copy -acodec copy output.mp4`, progressCallback);
        else cutVideo = await executeFFmpegCommand(fileInput.files[0], `-ss ${start} -to ${end} -i input.mp4 output.mp4`, progressCallback);
        // const cutVideo = await executeFFmpegCommand(fileInput.files[0], "-ss 00:00:10 -t 10 -i input.mp4 -vcodec copy -acodec copy output.mp4");
        // const cutVideo = await executeFFmpegCommand(fileInput.files[0], "-ss 00:00:03 -t 00:00:05 -i input.mp4 output.mp4");
        video.src = URL.createObjectURL(cutVideo);
        console.log(video.src);
        video.onloadeddata = () =>
        {
            const a = document.createElement('a');
            a.href = video.src;
            a.download = 'output.mp4';
            a.click();
            videoContainer.classList.add('active');
            progressMain.classList.remove('active');
            progressBar.style["width"] = "0.0%";
            percentage.textContent = "0.0%";
        }

    })
})  





async function executeFFmpegCommand(BinaryData, command, progressCallback)
{
    if (!(command instanceof String || typeof command == 'string')) return;
    const ffmpeg = createFFmpeg({log:false});
    const reader = new FileReader();
    await ffmpeg.load();
    console.log(...command.split(' '))
    const resPromise = new Promise((resolve, reject) =>
    {
        reader.onload = async (event) =>
        {
            ffmpeg.FS('writeFile', 'input.mp4', new Uint8Array(reader.result));
            await ffmpeg.run(...command.split(' '))
            const result = new Blob([ffmpeg.FS('readFile', 'output.mp4')]);
            //const resFile = new File([result], 'video.mp4', {type : "video/mp4"});
            //console.log(resFile)
            //ffmpeg.FS('unlink', 'input.mp4');
            resolve(new File([result], 'video.mp4'));
        }
        setTimeout(() => {
            reject('Time Limit Exceeded');
        }, 3600000);
        reader.readAsArrayBuffer(BinaryData);
    })
    ffmpeg.setProgress(progressCallback);
    return resPromise;

}