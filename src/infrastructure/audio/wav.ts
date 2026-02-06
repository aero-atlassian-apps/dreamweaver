export function encodeWavFromAudioBuffer(buffer: AudioBuffer): Blob {
    const numChannels = 1
    const sampleRate = buffer.sampleRate
    const channelData = buffer.getChannelData(0)

    const bytesPerSample = 2
    const blockAlign = numChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = channelData.length * bytesPerSample
    const headerSize = 44
    const totalSize = headerSize + dataSize

    const view = new DataView(new ArrayBuffer(totalSize))
    let offset = 0

    const writeString = (s: string) => {
        for (let i = 0; i < s.length; i++) {
            view.setUint8(offset++, s.charCodeAt(i))
        }
    }

    writeString('RIFF')
    view.setUint32(offset, totalSize - 8, true); offset += 4
    writeString('WAVE')
    writeString('fmt ')
    view.setUint32(offset, 16, true); offset += 4
    view.setUint16(offset, 1, true); offset += 2
    view.setUint16(offset, numChannels, true); offset += 2
    view.setUint32(offset, sampleRate, true); offset += 4
    view.setUint32(offset, byteRate, true); offset += 4
    view.setUint16(offset, blockAlign, true); offset += 2
    view.setUint16(offset, 16, true); offset += 2
    writeString('data')
    view.setUint32(offset, dataSize, true); offset += 4

    for (let i = 0; i < channelData.length; i++) {
        const x = Math.max(-1, Math.min(1, channelData[i] || 0))
        const s = x < 0 ? x * 0x8000 : x * 0x7fff
        view.setInt16(offset, s, true)
        offset += 2
    }

    return new Blob([view.buffer], { type: 'audio/wav' })
}

export async function convertBlobToWavFile(blob: Blob, fileName: string, targetSampleRate = 22050): Promise<File> {
    const input = await blob.arrayBuffer()
    const audioContext = new AudioContext()
    const decoded = await audioContext.decodeAudioData(input.slice(0))

    let rendered: AudioBuffer = decoded
    if (decoded.sampleRate !== targetSampleRate) {
        const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * targetSampleRate), targetSampleRate)
        const source = offline.createBufferSource()
        source.buffer = decoded
        source.connect(offline.destination)
        source.start(0)
        rendered = await offline.startRendering()
    }

    const wavBlob = encodeWavFromAudioBuffer(rendered)
    return new File([wavBlob], fileName, { type: 'audio/wav' })
}

