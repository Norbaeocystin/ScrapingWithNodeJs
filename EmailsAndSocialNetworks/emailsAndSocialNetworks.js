/*
Few functions to help with scraping emails and link to social networks
*/

const request = require('request-promise');
const emailPattern = /([-a-zA-Z0-9.`?{}]+@[-a-zA-Z0-9.`?{}]+[\.\w+]+)/g;
//add more if needed
const socialNetworks = ['facebook','twitter','linkedin','instagram']
const sn = socialNetworks.map(social => social +"[.]com")
const socialNetworksPattern = new RegExp(sn.join("|"))

async function get(url)
{
    let response = request(url);
    return await response;
}

async function getEmails(url)
{
    let html = await get(url);
    let emails = html.match(emailPattern);
    return emails;
}

function getSocialNetworksFromHTMLText(text)
{
    var splits = text.split('<a')
    let result = {};
    if (splits)
    {
        var splits = splits.map(split => split.split('>')[0])
        splits = splits.filter(split => split.match(socialNetworksPattern))
        result = {}
        for (split of splits)
            {
                let link = split.split('href="')[1].split('"')[0];
                for (socnet of socialNetworks)
                    {
                        if (link.includes(socnet))
                            {
                                result[socnet] = link;
                                break;
                            }
                    }
            }
    }
    return result;
}

async function getEmailsAndSNs(url)
{
    let html = await get(url);
    let emails = html.match(emailPattern);
    let sns = getSocialNetworksFromHTMLText(html);
    if (emails)
        {
            let uniqueEmails = new Set(emails)
            sns['Emails'] = Array.from(uniqueEmails);
        }
    return sns;
}
