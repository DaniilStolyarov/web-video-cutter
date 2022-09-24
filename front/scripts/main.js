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
        video.onloadedmetadata = (ev) =>
        {
            document.querySelector('#time-end').value = (new Date(+video.duration*1000 + (new Date()).getTimezoneOffset() * 60000)).toTimeString().split(' ')[0];
            document.querySelector('#time-start').addEventListener("change", (event)=>
            {
                const listTime = event.target.value.split(':');
                let seconds = (+listTime[0]) * 3600 + (+listTime[1]) * 60 + (+listTime[2]);
                if (seconds > video.duration)
                {
                    seconds = video.duration - 1;
                    const date = (new Date(seconds*1000 + (new Date()).getTimezoneOffset() * 60000)).toTimeString().split(' ')[0];
                    event.target.value = date;
                }

                document.querySelector('#first-slider').value = seconds;
            })
            document.querySelector('#time-end').addEventListener("change", (event)=>
            {
                const listTime = event.target.value.split(':');
                let seconds = (+listTime[0]) * 3600 + (+listTime[1]) * 60 + (+listTime[2]);
                if (seconds > video.duration) 
                {
                    seconds = video.duration;
                    const date = (new Date(seconds*1000 + (new Date()).getTimezoneOffset() * 60000)).toTimeString().split(' ')[0];
                    event.target.value = date;
                }
                document.querySelector('#second-slider').value = seconds;
            })

            document.querySelectorAll('.slider-container input[type = range]').forEach((elem) =>
            {
                elem.setAttribute('max', video.duration);
                if (elem.id == "second-slider") elem.setAttribute('value', video.duration);
            })

            const sliders = document.querySelectorAll('.slider-container input[type="range"]');

            sliders[0].addEventListener('input', (event) => {
            if (+sliders[0].value > +sliders[1].value)
            {
                sliders[1].value = +sliders[0].value;
                const date = (new Date(event.target.value*1000 + (new Date()).getTimezoneOffset() * 60000)).toTimeString().split(' ')[0];
                document.getElementById("time-start").value = date;
                document.getElementById("time-end").value = date;
            }
            else
            {
                const date = (new Date(event.target.value*1000 + (new Date()).getTimezoneOffset() * 60000)).toTimeString().split(' ')[0];
                document.getElementById("time-start").value = date;
            }
            });
            
            sliders[1].addEventListener('input', (event) => {
            if (+sliders[1].value < +sliders[0].value)
            {
                sliders[0].value = +sliders[1].value;
                const date = (new Date(event.target.value*1000 + (new Date()).getTimezoneOffset() * 60000)).toTimeString().split(' ')[0];
                document.getElementById("time-start").value = date;
                document.getElementById("time-end").value = date;
            }
            else
            {
                const date = (new Date(event.target.value*1000 + (new Date()).getTimezoneOffset() * 60000)).toTimeString().split(' ')[0];
                document.getElementById("time-end").value = date;
            }
            });
        }
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
        let ratioDOM;
        document.querySelectorAll('[type=radio]').forEach(elem =>
            {
                if (elem.checked) ratioDOM = elem;
            })
        const ratio = ratioDOM.value;
        
        const start = startTimeDOM.value;
        const end = endTimeDOM.value;
        
        const arrStart = start.split(':');
        const arrEnd = end.split(':');
        const duration = (parseInt(arrEnd[0])*3600 + parseInt(arrEnd[1]) * 60 + parseInt(arrEnd[2])) - (parseInt(arrStart[0])*3600 + parseInt(arrStart[1]) * 60 + parseInt(arrStart[2]));
        

        const useRender = qualityDOM.checked;
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
        if (!useRender) cutVideo = await executeFFmpegCommand(fileInput.files[0], `-ss ${start} -to ${end} -i input.mp4 -aspect ${ratio} -vcodec copy -acodec copy output.mp4`, progressCallback);
        else cutVideo = await executeFFmpegCommand(fileInput.files[0], `-ss ${start} -to ${end} -i input.mp4 -aspect ${ratio} output.mp4`, progressCallback);
        video.src = URL.createObjectURL(cutVideo);
        console.log(video.src);
        video.onloadeddata = () =>
        {
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
            resolve(new File([result], 'video.mp4', {type : "video/mp4"}));
        }
        setTimeout(() => {
            reject('Time Limit Exceeded');
        }, 3600000);
        reader.readAsArrayBuffer(BinaryData);
    })
    ffmpeg.setProgress(progressCallback);
    return resPromise;

}