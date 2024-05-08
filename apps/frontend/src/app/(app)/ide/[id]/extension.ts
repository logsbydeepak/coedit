import extensionConfig from '#/utils/symbol-icon-theme.json'

export function getExtensionIcon({
  name,
  isDirectory,
}: {
  name: string
  isDirectory: boolean
}) {
  const data = extensionConfig as {
    iconDefinitions: {
      [key: string]: { iconPath: string }
    }
    fileExtensions: {
      [key: string]: string
    }
    fileNames: {
      [key: string]: string
    }
    languageIds: {
      [key: string]: string
    }
    folderNames: {
      [key: string]: string
    }
    file: string
    folder: string
  }

  const defaultFileIcon = data.iconDefinitions[data.file].iconPath
  const defaultFolderIcon = data.iconDefinitions[data.folder].iconPath

  let result = ''

  if (isDirectory) {
    const icon = data.folderNames[name]
    result = data.iconDefinitions[icon]?.iconPath
  } else {
    const ext = name.split('.').pop() || ''

    if (data.fileNames[name]) {
      result = data.iconDefinitions[data.fileNames[name]]?.iconPath
    }

    if (data.fileExtensions[ext]) {
      result = data.iconDefinitions[data.fileExtensions[ext]]?.iconPath
    }
  }

  if (!result) {
    result = isDirectory ? defaultFolderIcon : defaultFileIcon
  }

  return ('/' + result.replace('./', '')) as string
}
