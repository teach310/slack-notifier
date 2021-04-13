const defaultChannel = 'notifications';

const doPost = (event) => {

  const spreadsheet = SpreadsheetApp.getActive();
  const sheetReader = new SheetReader(spreadsheet);
  
  channels = sheetReader.findAll('channels');
  webhookUrl = channels.find(x => x.name === defaultChannel).webhookUrl;

  let eventData;
  try {
    eventData = JSON.parse(event.postData.getDataAsString());
  } catch (e) {
    postMessage(webhookUrl, e.toString());
    return;
  }
  
  const githubEvent = getGitHubEvent(eventData);

  try {
    handleGitHubEvent(sheetReader, githubEvent, eventData)
  } catch (e) {
    postMessage(webhookUrl, e.toString());
  }
  return; // リダイレクトしないように何も返さない
}

// GASではheader取得方法がないのでbodyからeventを推測する
// リクエストの種類
// issue_comment (プルリクエスト内のコメントもissue_commentっぽい)
// イベントとPayloadの一覧　https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#issue_comment
const getGitHubEvent = (eventData) => {
  if ('issue' in eventData && 'comment' in eventData) {
    return 'issue_comment';
  }else if('pull_request' in eventData && 'review' in eventData){
    return 'pull_request_review'
  }else if('pull_request' in eventData && 'comment' in eventData){
    return 'pull_request_review_comment'
  }
  // TODO pull_request_comment追加
  
  return 'unknown_event';
}

const replaceGitHubMentionToSlack = (users, message) => {
  const githubMentions = message.match(/@[a-zA-Z0-9-]+/g);
  if (!githubMentions) {
    return message;
  }
  let temp = message;
  for (const githubMention of githubMentions) {
    const githubName = githubMention.replace('@', '');
    const user = users.find(x => x.githubName === githubName);
    temp = temp.replace(githubMention, `<@${user.slackUserId}>`);
  }
  return temp;
}

const handleGitHubEvent = (sheetReader, githubEvent, eventData) => {
  switch (githubEvent) {
    case 'issue_comment':
      handleIssueComment(sheetReader, eventData);
      return;
    case 'pull_request_review':
      handlePullRequestReview(sheetReader, eventData);
      return;
    case 'pull_request_review_comment':
      handlePullRequestReviewComment(sheetReader, eventData);
      return;
  }
  throw 'unknown event'
}

const handleIssueComment = (sheetReader, eventData) => {
  const title = `${eventData.issue.number} ${eventData.issue.title}`;
  handleComment(sheetReader, title, eventData.comment);
}

const handlePullRequestReview = (sheetReader, eventData) => {
  const title = `${eventData.pull_request.number} ${eventData.pull_request.title}`;
  const titlePrefix = `PullRequest ${eventData.review.state} on`
  handleComment(sheetReader, title, eventData.review, titlePrefix);
}

const handlePullRequestReviewComment = (eventData) => {
  const title = `${eventData.pull_request.number} ${eventData.pull_request.title}`;
  handleComment(sheetReader, title, eventData.comment);
}

const handleComment = (sheetReader, title, comment, titlePrefix = 'Comment on') => {
  const commentBody = comment.body;
  const commentHtmlUrl = comment.html_url;
  const commentUserName = comment.user.login;
  const commentUserIconUrl = comment.user.avatar_url;

  let message = `${titlePrefix} <${commentHtmlUrl}|#${title}>\n` + commentBody;

  const users = sheetReader.findAll('users');

  message = replaceGitHubMentionToSlack(users, message)

  const blocks = createBlocksForComment(commentUserIconUrl, commentUserName, message);
  const url = channels.find(x => x.name === defaultChannel).webhookUrl;
  return postMessageByBlocks(url, blocks);
}

const test_webhookUrl = () => {
  const spreadsheet = SpreadsheetApp.getActive();
  const sheetReader = new SheetReader(spreadsheet);
  
  const channels = sheetReader.findAll('channels');
  const webhookUrl = channels.find(x => x.name === defaultChannel).webhookUrl;
  console.log(webhookUrl)
}

const test_replaceGitHubMentionToSlack = () => {
  const users = [{
    githubName: 'github-taro',
    slackUserId: 'taro_slack_id'
  }]

  const message = '@github-taro hello taro!';
  const expect = '<@taro_slack_id> hello taro!'
  const got = replaceGitHubMentionToSlack(users, message);
  console.log(got === expect);
}