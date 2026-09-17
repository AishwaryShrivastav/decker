# Decker first-10 pilot kit

## Success condition

A pilot counts as activated when the user installs Decker, records a consented Google Meet, reviews the transcript, and generates one output they would show or send to another participant.

The launch target is ten activated users. We will record whether each output was opened, presented during the call, shared afterward, and reused as a working artifact.

## Who to recruit

Recruit people with a meeting in the next ten days and enough technical confidence to use an OpenAI API key.

| Segment | Seats | Meeting to target | Why Decker can help |
| --- | ---: | --- | --- |
| Small software or AI agency founders | 4 | Discovery, scope review, or kickoff | They owe the client an artifact and can judge whether it captures commitments. |
| Product and design consultants | 3 | Workshop, research synthesis, or recommendation review | They regularly turn conversation into a client-facing document. |
| Technical founders or product leads | 3 | Roadmap, architecture, or launch review | They need decisions, boundaries, and owners while the team is present. |

Skip general productivity audiences for this cohort. The OpenAI-key requirement and Google Meet capture flow make technical, artifact-producing hosts the fastest path to useful feedback.

## Offer

The extension is free. Each pilot gets a 15-minute setup check, one short rehearsal, and a 20-minute follow-up after a real meeting. In return, ask permission to record only product feedback and anonymized activation outcomes. Never request the meeting transcript or generated output unless the user volunteers it and explicitly approves sharing.

## Outreach drafts

### Direct message to an agency founder

I built a Chrome extension for client calls. It records a Google Meet without adding a bot, lets you review the transcript, and generates a closing deck with decisions, scope, and owners.

I am looking for ten people with a real client or planning call in the next ten days. I will help with setup and join a short rehearsal. Would you try it on one meeting and give me twenty minutes of honest feedback afterward?

Chrome listing: https://chromewebstore.google.com/detail/decker-google-meet-notes/khbafeikhdehdhpfcbdlfkpmmikbfihk

### Warm LinkedIn post

I kept leaving good meetings with the same loose end: somebody still had to turn the conversation into something the room could approve and use.

Decker records Google Meet from the host's browser, then creates a deck or brief from the reviewed transcript. No bot joins the call. It uses the host's OpenAI key and sends no automatic usage data to me.

I am running ten assisted pilots with agency founders, consultants, and product leads. The useful test is simple: would you present or send the generated artifact after a real meeting? If you have a suitable call in the next ten days, reply or message me.

### GitHub or builder-community post

Decker is an open-source Chrome extension that records Google Meet without a bot and turns a reviewed transcript into an HTML deck, meeting brief, discussion page, or prototype. It uses one OpenAI key in the browser.

The current release is focused on a narrow workflow: end a meeting with decisions, scope, and owners visible to the room. I am looking for ten technical hosts willing to test one real call. The repository, privacy details, sample output, and Chrome listing are linked here: https://decker.techforgood.studio

## Pilot runbook

Before the meeting:

1. Confirm Chrome or a Chromium browser, a Google Meet, and an active OpenAI API key.
2. Install from the Chrome Web Store and pin Decker.
3. Save the key, allow microphone access, and run a two-minute Meet rehearsal.
4. Tell participants that audio and transcript content will be sent to OpenAI and obtain required consent.
5. Ask the host what artifact would make the meeting useful.

During the meeting:

1. Start recording from the Meet tab.
2. Confirm the recording indicator and audio state.
3. Stop after the decision portion of the call.
4. Review the transcript and selected topics.
5. Generate the format the host planned to use.

After the meeting, ask:

1. Did the output represent the decision accurately?
2. What did you edit before showing or sending it?
3. Did you present it during the call, share it later, or discard it?
4. Which step felt uncertain or took too long?
5. What would make you use Decker for the next similar meeting?

## Weekly channel order

1. Send ten warm messages to technical agency founders and consultants with a meeting already scheduled.
2. Run the first three assisted calls before posting broadly. Use their objections to update onboarding and copy.
3. Publish the LinkedIn post with one real, permissioned output and the sample deck.
4. Share the technical build in GitHub, Indie Hackers, and suitable builder communities. Follow each community's promotion rules.
5. Ask activated users for one introduction to another meeting host. Ask for a Chrome review only after they complete a useful output.

Paid ads are out of scope until at least five pilots activate. Current friction comes from setup and trust, so broader traffic would produce weak data.

## Pilot ledger

Use `gtm/pilots.csv`. Record operational facts only. Keep names and contact details in a private copy outside the public repository.

The key measures are:

- install completed;
- key saved;
- rehearsal completed;
- real recording started;
- transcript reviewed;
- output generated;
- output presented or shared;
- second meeting scheduled.
