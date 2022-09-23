const {createFFmpeg} = FFmpeg;
window.addEventListener("load", async () =>
{
    const fileInput = document.getElementById("video-input");
    const fileInputLabel = document.querySelector("[for = video-input]");
    const video = document.getElementsByTagName("video")[0];
    const videoContainer = document.getElementsByClassName("video-container")[0];
    const ffmpeg = createFFmpeg({log:true});

    await ffmpeg.load();

    fileInput.onchange = async (event) =>
    {
        //const cutVideo = await executeFFmpegCommand(fileInput.files[0], "-ss 00:00:10 -t 10 -i input.mp4 -vcodec copy -acodec copy output.mp4");
        const cutVideo = await executeFFmpegCommand(fileInput.files[0], "-ss 00:00:03 -t 00:00:05 -i input.mp4 output.mp4");
        videoContainer.classList.add('active');
        fileInputLabel.classList.remove('active');
        video.src = URL.createObjectURL(cutVideo);
        video.onloadeddata = () =>
        {
            video.play();
        }
    }
})  





async function executeFFmpegCommand(BinaryData, command)
{
    if (!(command instanceof String || typeof command == 'string')) return;
    const ffmpeg = createFFmpeg({log:true});
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
            resolve(result);
        }
        setTimeout(() => {
            reject('Time Limit Exceeded');
        }, 3600000);
        reader.readAsArrayBuffer(BinaryData);
    })
    return resPromise;

}