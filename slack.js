const postMessage = (url, message) => {
  const data = {
    text: message
  }
  postToSlack(url, data)
}

const postMessageByBlocks = (url, blocks) => {
  const data = {
    blocks: blocks
  }
  postToSlack(url, data)
}

const createBlocksForComment = (user_icon_url, user_name, message) => {
  return [
    {
      type: "context",
      elements: [
        {
          type: "image",
          image_url: user_icon_url,
          alt_text: "images"
        },
        {
          type: "mrkdwn",
          text: `*${user_name}*`
        }
      ]
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${message}`
      }
    }
  ]
}

const postToSlack = (url, data) => {
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(data)
  }
  const res = UrlFetchApp.fetch(url, options)
  return res.getContentText()
}

