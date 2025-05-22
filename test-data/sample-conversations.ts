/**
 * Sample conversation data for testing Rylie AI
 * These simulate realistic customer interactions for various dealership scenarios
 */

export const sampleConversations = {
  equityOffer: {
    dealershipInitialMessage: "Hi Jane, it looks like you have equity in your current vehicle! Would you be interested in upgrading to a newer model with little or no money down?",
    customerReplies: [
      "Hey, I didn't realize my car had any equity. What does that actually mean for me? I'm not sure if I want a new car but maybe if my payment wouldn't go up a lot. Can you tell me what my options are?",
      "ok but u guys always say 'little to no money down' then i come in and they tell me i need 3 grand lol. not tryin to waste my time. can u actually tell me real numbers this time??",
      "idk if i even wanna do this. last dealer said same thing then tried bait n switch. is this for real or just another ad? be straight w me plz."
    ]
  },
  
  leaseMaturity: {
    dealershipInitialMessage: "Hi Chris, your lease on the 2021 Camry is coming up soon. Would you like to explore your options for a new lease or purchase?",
    customerReplies: [
      "Yeah I got your message about my lease ending soon. What do I need to do? Can I just drop off the car or do I have to set up an appointment first? Not sure if I want to lease again or maybe buy this time.",
      "yo i lost the extra key and i got a scratch on the bumper is that a big deal or nah? i dnt want like a million fees lol. also im moving next month so not sure if i can bring it back in time.",
      "wait so if i turn in the car late am i gettin charged? i been gettin different answers every time i call, nobody knows what's goin on. i just wanna know what's actually gonna happen."
    ]
  },
  
  overdueService: {
    dealershipInitialMessage: "Hi Maria, our records show your 2018 CR-V is due for its next scheduled service. Can we help you book an appointment?",
    customerReplies: [
      "Thanks for reminding me! I've been putting it off. Is there a way to get a loaner car if my service takes a while? Also, what's the earliest you could fit me in on a Saturday?",
      "my car keeps makein a weird sound when i turn left, but i dont got time to sit around all day. u sure u got loner cars? last time yall were out. also i work nights so i sleep most saturdays.",
      "man i called last week n got bounced around to like 3 ppl. do i gotta talk to service or what? jus wanna get my car fixed n go. u guys always got me on hold smh."
    ]
  },
  
  lostLead: {
    dealershipInitialMessage: "Hi Alex, we noticed you were looking at several SUVs on our site last month but didn't finish your purchase. Anything we can do to help you move forward?",
    customerReplies: [
      "Oh hey, yeah I was looking but just got busy with work and never came back. I'm still interested if you have anything with AWD under $25k. Do you have any specials or new arrivals that fit what I was looking for?",
      "honestly i was just browsing. idk if i'm ready to buy, prices seem wild rn. u got anything cheaper than what's on ur site? also i gotta get rid of my old car first.",
      "yo tbh last time i came by the sales dude kept pushin all this warranty stuff n i bounced. not tryna deal with that again. what u got that's no bs? just want a straight deal no hassle."
    ]
  },
  
  tradeInValue: {
    dealershipInitialMessage: "Hi Sean, we're seeing a high demand for vehicles like your 2017 Tacoma. Want to see what it's worth toward a newer model?",
    customerReplies: [
      "I've been thinking about trading in but not sure if now's the right time. Can you give me a rough idea of what my truck's worth without me coming in? It's got about 120k miles but I've kept up with all the maintenance.",
      "lol yall always lowballin ppl tho. my buddy got like 3k less than kbb last time he came in. i don't got time for games so if u got a real number lmk. also the A/C just started actin up, dunno if that matters.",
      "whatever, last time i did this i drove an hour and then the offer dropped by $1500 'for condition.' feels like a scam. not tryna get played again. can u actually give me a straight up answer or nah?"
    ]
  },
  
  serviceSatisfaction: {
    dealershipInitialMessage: "Hi Dana, just checking in to see how your recent service visit went. Was everything to your satisfaction?",
    customerReplies: [
      "Yeah the service was good, thanks. Only thing is the waiting area was kind of crowded when I was there. The guy who checked me in was great though.",
      "nah the wifi barely worked and it took way longer than u said. i hadda be somewhere but no1 updated me. can yall text me next time if it's gonna be late?",
      "last time it was ok but 2 times ago i waited almost 3 hours just for an oil change. u guys keep tellin me different stuff every time. i dont even know if i wanna come back tbh."
    ]
  },
  
  equityUpgrade: {
    dealershipInitialMessage: "Hi Terrence, your current vehicle puts you in a great position to upgrade with little or nothing down! Interested in seeing what new models you qualify for?",
    customerReplies: [
      "That sounds pretty good. Are there any deals for people who are already customers? I don't want my payment to go way up, but I'd consider upgrading if it makes sense.",
      "idk i seen ads before and when i went in it was nothing like what they said. do u got anything real for ppl like me or is it just for new customers? my payments gotta stay low or i can't do it.",
      "bruh if u just gonna try to upsell me like the last guy don't bother. i just want facts no bs. if i can get a better car for same payment, cool. if not, i'm good."
    ]
  },
  
  leasePullAhead: {
    dealershipInitialMessage: "Hi Rachel, you're eligible to upgrade early from your lease with potential savings. Want to find out more?",
    customerReplies: [
      "I didn't realize I could get out early. Will there be any penalties if I end my lease a few months before it's up? How does that work?",
      "what if i just wanna swap to a bigger suv? my fam's growin and i need more space but can't really pay more. also my bumper got a dent. does that matter for turnin it in?",
      "not tryna get stuck with a bunch of hidden fees like last time. every time i ask someone i get a diff answer. can someone actually tell me what's up for real?"
    ]
  },
  
  priceShopper: {
    dealershipInitialMessage: "Hi Greg, we noticed you requested a quote on the new Accord. Any questions I can answer to help you move forward?",
    customerReplies: [
      "I got a couple quotes from other places but haven't made up my mind yet. If you can beat $399 a month, I might be interested. What's your best deal right now?",
      "yeah but don't play games. last time i came in yall added a bunch of fees i didn't know about. i need the OTD price—no hidden stuff. u can do that or nah?",
      "tbh not tryna get hosed lol. just give me the real deal. dont wanna drive all the way if u just gonna add 'dealer fees' at the end. i'll go somewhere else if it's not what u say."
    ]
  },
  
  serviceSpecial: {
    dealershipInitialMessage: "Hi Linda, we have a service special this month—20% off brake service. Interested in booking?",
    customerReplies: [
      "I could probably use that soon, my brakes have been squeaking a bit. Do you guys offer shuttle service, or do I need to wait at the dealership?",
      "last time yall said it'd be done in an hour n i waited 3. if i come in this week u really gonna get me out quick? gotta be at work by 1pm.",
      "ngl last visit wasn't great. i had to ask for my car twice and no1 seemed to know what was goin on. why should i come back this time?"
    ]
  }
};

/**
 * Example usage:
 * 
 * // To create a test conversation
 * const { dealershipInitialMessage, customerReplies } = sampleConversations.equityOffer;
 * 
 * // Initial outreach from dealership
 * console.log(dealershipInitialMessage);
 * 
 * // First customer reply (for testing Rylie's first response)
 * console.log(customerReplies[0]);
 * 
 * // Later customer replies (testing how Rylie handles more difficult cases)
 * console.log(customerReplies[1]); // Second reply
 * console.log(customerReplies[2]); // Third reply
 */

// Create a utility function to generate a test conversation
export function createTestConversation(scenarioKey: keyof typeof sampleConversations, replyIndex = 0) {
  const scenario = sampleConversations[scenarioKey];
  
  return {
    dealershipMessage: scenario.dealershipInitialMessage,
    customerReply: scenario.customerReplies[replyIndex] || scenario.customerReplies[0],
    scenarioName: scenarioKey
  };
}

// Export a function to get a random test conversation
export function getRandomTestConversation() {
  const scenarioKeys = Object.keys(sampleConversations) as Array<keyof typeof sampleConversations>;
  const randomScenario = scenarioKeys[Math.floor(Math.random() * scenarioKeys.length)];
  const replyIndex = Math.floor(Math.random() * sampleConversations[randomScenario].customerReplies.length);
  
  return createTestConversation(randomScenario, replyIndex);
}