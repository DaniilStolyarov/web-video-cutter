const {createFFmpeg} = FFmpeg;

window.addEventListener("load", async () =>
{
    const fileInput = document.getElementById("video-input");
    const fileInputLabel = document.querySelector("[for = video-input]");
    const fileAdd = document.getElementById("video-add");
    const video = document.getElementsByTagName("video")[0];
    const videoContainer = document.getElementsByClassName("video-container")[0];
    const startEncoding = document.querySelector(".start-encoding");
    const ListAddedVideos = [];
    fileInput.onchange = async (event) =>
    {  
        videoContainer.classList.add('active');
        fileInputLabel.classList.remove('active');

        ListAddedVideos.push(fileInput.files[0]);
        const firstFileNameDOM = document.createElement('div');
        firstFileNameDOM.classList.add("video-name");
        let FileName = (ListAddedVideos[0].name).split('.')[0];
        if (FileName.length > 8) FileName = FileName.slice(0,9) + "...";
        firstFileNameDOM.textContent = FileName + '.' + (ListAddedVideos[0].name).split('.')[1];
        if (firstFileNameDOM && document.querySelector('.video-name-container'))
        document.querySelector('.video-name-container').append(firstFileNameDOM);
        
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
                video.currentTime = +sliders[0].value;
            });
            
            sliders[1].addEventListener('input', (event) => {
            if (+sliders[1].value < +sliders[0].value)
            {
                sliders[0].value = +sliders[1].value;
                const date = (new Date(event.target.value*1000 + (new Date()).getTimezoneOffset() * 60000)).toTimeString().split(' ')[0];
                document.getElementById("time-start").value = date;
                document.getElementById("time-end").value = date;
                video.currentTime = +sliders[0].value;
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
        const logo = document.querySelector('#logo').files[0];
        const processCountMax = 1 + (logo ? 1 : 0);
        let processCount = 1;
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
            const complete = parseFloat((+progress.time / +duration).toFixed(3));
            if (complete >= 1)
            {
                if (processCount >= processCountMax)
                {
                    videoContainer.classList.add('active');
                    progressMain.classList.remove('active');
                    progressBar.style["width"] = "0.0%";
                    percentage.textContent = "0.0%";
                }
                else
                {
                    processCount = processCount + 1;
                    console.log(processCount)
                }

            }
            else if (complete * 100 + 1 <= 100)
            {
                progressBar.style["width"] = (complete * 100 + 1).toFixed(1) + "%";
                percentage.textContent = (complete * 100 + 1).toFixed(1) + "% (" + processCount + "/" + processCountMax + ")";
            }
        }
        if (duration <= 0) 
        {
            alert(`Поле 'ОБРЕЗАТЬ ДО' должно быть строго больше поля 'ОБРЕЗАТЬ С'`);
            return;
        }
        
        videoContainer.classList.remove('active');
        progressMain.classList.add('active');

        const ffmpeg = createFFmpeg({log : true})
        if (!useRender) cutVideo = await executeFFmpegCommand(fileInput.files[0], `-ss ${start} -to ${end} -i input.mp4 -aspect ${ratio} -vcodec copy -acodec copy output.mp4`, progressCallback, ffmpeg);
        else cutVideo = await executeFFmpegCommand(fileInput.files[0], `-ss ${start} -to ${end} -i input.mp4 -aspect ${ratio} output.mp4`, progressCallback, ffmpeg);
        //if (!useRender) cutVideo = await executeFFmpegCommand(fileInput.files[0], `-ss ${start} -to ${end} -i input.mp4 -aspect ${ratio} -vcodec copy -acodec copy output.mp4`, progressCallback);
        //else cutVideo = await executeFFmpegCommand(fileInput.files[0], `-i input.mp4 -vf "scale=-1:720,pad=1280:ih:(ow-iw)/2" output.mp4`, progressCallback);

        // if (ListAddedVideos.length > 1)
        // {
        //     cutVideo = await concatTwoVideos(ListAddedVideos[0], ListAddedVideos[1]);
        // }
        //await putTextOnVideo(cutVideo, "Hello, world!");  
        
        if (logo) 
        {
            cutVideo = await putLogoOnVideo(cutVideo, logo, ffmpeg);

        }

        
        console.log("______________________________________________________________________")
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
    if (fileAdd)
    fileAdd.addEventListener('change', (event) =>
    {
        ListAddedVideos.push(event.target.files[0]);
        const firstFileNameDOM = document.createElement('div');
        firstFileNameDOM.classList.add("video-name");
        let FileName = (ListAddedVideos[ListAddedVideos.length - 1].name).split('.')[0];
        if (FileName.length > 8) FileName = FileName.slice(0,9) + "...";
        firstFileNameDOM.textContent = FileName + '.' + (ListAddedVideos[ListAddedVideos.length - 1].name).split('.')[1];
        document.querySelector('.video-name-container').append(firstFileNameDOM);
        console.log(ListAddedVideos)
        event.target.value = "";
    })
})  





async function executeFFmpegCommand(BinaryData, command, progressCallback, ffmpeg)
{
    if (!(command instanceof String || typeof command == 'string')) return;
    
    const reader = new FileReader();
    await ffmpeg.load();

    const resPromise = new Promise((resolve, reject) =>
    {
        reader.onload = async (event) =>
        {
            ffmpeg.FS('writeFile', 'input.mp4', new Uint8Array(reader.result));
            console.log(new Uint8Array(reader.result))
            await ffmpeg.run(...command.split(' '))
            const result = new Blob([ffmpeg.FS('readFile', 'output.mp4')]);
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


async function concatTwoVideos(video1, video2)
{
    const ffmpeg = createFFmpeg({log:false});
    const reader1 = new FileReader();
    const reader2 = new FileReader();
    await ffmpeg.load();
    reader1.readAsArrayBuffer(video1);
    reader2.readAsArrayBuffer(video2);
    const res1Promise = new Promise((resolve, reject) =>
    {
        reader1.onload = async (event) =>
        {
            resolve(new Uint8Array(reader1.result));
        }
        setTimeout(() => {
            reject('Time Limit Exceeded');
        }, 3600000);
    })
    const res2Promise = new Promise((resolve, reject) =>
    {
        reader2.onload = async (event) =>
        {
            resolve(new Uint8Array(reader2.result));
        }
        setTimeout(() => {
            reject('Time Limit Exceeded');
        }, 3600000);
    })

    ffmpeg.FS("writeFile", "video1.mkv", await res1Promise);
    ffmpeg.FS("writeFile", "video2.mkv", await res2Promise);

    let command = '-i video1.mkv -i video2.mkv -filter_complex "[0:v] [0:a] [1:v] [1:a] concat=n=2:v=1:a=1 [v] [a] -map "[v]" -map "[a]" output.mkv'
    await ffmpeg.run(...command.split(' '));
    console.log(ffmpeg.FS('readFile', 'output.mkv'))
    // const result = new Blob([ffmpeg.FS('readFile', 'output.mkv')]);
    // return (new File([result], 'video.mkv', {type : "video/mkv"}));
}
async function putLogoOnVideo(BinaryData, logo, ffmpeg)
{
    const resPromise = new Promise((resolve, reject) =>
    {
        const reader = new FileReader();
        reader.readAsArrayBuffer(BinaryData);
        
        reader.onload = async (event) =>
        {
            ffmpeg.FS('writeFile', 'in.mp4', new Uint8Array(reader.result));
            const logoReader = new FileReader();
            logoReader.readAsArrayBuffer(logo);
            logoReader.onload = async (ev) =>
            {
                ffmpeg.FS('writeFile', 'logo.png', new Uint8Array(logoReader.result));
                await ffmpeg.run('-i', 'logo.png', '-vf', 'scale=50:50', 'fixed-logo.png');
                await ffmpeg.run('-y', '-i', 'in.mp4', '-i', 'fixed-logo.png', '-filter_complex', 'overlay=x=main_w*0.01:y=main_h*0.01', 'out.mp4')
                const result = new Blob([ffmpeg.FS('readFile', 'out.mp4')]);
                resolve(new File([result], 'video.mp4', {type : "video/mp4"}));
            }
        }
        setTimeout(() => {
            reject('Time Limit Exceeded')
        }, 3600000);
    })
    return resPromise;
}