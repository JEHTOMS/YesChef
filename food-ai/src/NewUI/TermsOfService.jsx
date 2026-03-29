import React from "react";
import { useNavigate } from 'react-router-dom';
import '../pages/Home.css';
import '../index.css';
import NewNavbar from "../NewUI/NewNavbar.jsx";
import './Menu.css';
import './Profile.css';

function TermsOfService() {
    const navigate = useNavigate();

    return (
        <div className="page">
            <NewNavbar
                showBackButton
                onBackClick={() => navigate(-1)}
                onLogoClick={() => navigate('/')}
            />
            <div className="main-content">
                <div className="container layout-sm">
                    <div className="page-title text-title">Terms of Service</div>
                    <p className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.55)', marginBottom: '24px' }}>Last updated March 07, 2026</p>

                    <div className="privacy-content">

                        <p className="text-subtitle">Agreement to Our Legal Terms</p>
                        <p className="text-lg content-sec-color">
                            We are Yescheff.co ('Company', 'we', 'us', or 'our'), a company registered in England.
                        </p>
                        <p className="text-lg content-sec-color">
                            We operate the website <a href="https://yescheff.co" target="_blank" rel="noopener noreferrer">yescheff.co</a> (the 'Site'), as well as any other related products and services that refer or link to these legal terms (the 'Legal Terms') (collectively, the 'Services').
                        </p>
                        <p className="text-lg content-sec-color">
                            YesCheff is a web app that allows people to learn, cook, and enjoy their favorite recipes by transforming cooking videos into structured, easy-to-follow recipes with timers and step-by-step guidance.
                        </p>
                        <p className="text-lg content-sec-color">
                            You can contact us by email at <a href="mailto:hello@yescheff.co">hello@yescheff.co</a>.
                        </p>
                        <p className="text-lg content-sec-color">
                            These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity ('you'), and Yescheff.co, concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms. IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.
                        </p>
                        <p className="text-lg content-sec-color">
                            We will provide you with prior notice of any scheduled changes to the Services you are using. The modified Legal Terms will become effective upon posting or notifying you by hello@yescheff.co, as stated in the email message. By continuing to use the Services after the effective date of any changes, you agree to be bound by the modified terms.
                        </p>
                        <p className="text-lg content-sec-color">
                            All users who are minors in the jurisdiction in which they reside (generally under the age of 18) must have the permission of, and be directly supervised by, their parent or guardian to use the Services.
                        </p>

                        {/* Table of Contents */}
                        <p className="text-subtitle" style={{ marginTop: '24px' }}>Table of Contents</p>
                        <ol className="privacy-toc text-lg">
                            <li><a href="#tos-1">Our Services</a></li>
                            <li><a href="#tos-2">Intellectual Property Rights</a></li>
                            <li><a href="#tos-3">User Representations</a></li>
                            <li><a href="#tos-4">User Registration</a></li>
                            <li><a href="#tos-5">Purchases and Payment</a></li>
                            <li><a href="#tos-6">Subscriptions</a></li>
                            <li><a href="#tos-7">Prohibited Activities</a></li>
                            <li><a href="#tos-8">User Generated Contributions</a></li>
                            <li><a href="#tos-9">Contribution Licence</a></li>
                            <li><a href="#tos-10">Social Media</a></li>
                            <li><a href="#tos-11">Third-Party Websites and Content</a></li>
                            <li><a href="#tos-12">Services Management</a></li>
                            <li><a href="#tos-13">Privacy Policy</a></li>
                            <li><a href="#tos-14">Copyright Infringements</a></li>
                            <li><a href="#tos-15">Term and Termination</a></li>
                            <li><a href="#tos-16">Modifications and Interruptions</a></li>
                            <li><a href="#tos-17">Governing Law</a></li>
                            <li><a href="#tos-18">Dispute Resolution</a></li>
                            <li><a href="#tos-19">Corrections</a></li>
                            <li><a href="#tos-20">Disclaimer</a></li>
                            <li><a href="#tos-21">Limitations of Liability</a></li>
                            <li><a href="#tos-22">Indemnification</a></li>
                            <li><a href="#tos-23">User Data</a></li>
                            <li><a href="#tos-24">Electronic Communications, Transactions, and Signatures</a></li>
                            <li><a href="#tos-25">California Users and Residents</a></li>
                            <li><a href="#tos-26">Miscellaneous</a></li>
                            <li><a href="#tos-27">Contact Us</a></li>
                        </ol>

                        {/* 1 */}
                        <p className="text-subtitle" id="tos-1" style={{ marginTop: '24px' }}>1. Our Services</p>
                        <p className="text-lg content-sec-color">The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Services from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.</p>

                        {/* 2 */}
                        <p className="text-subtitle" id="tos-2" style={{ marginTop: '24px' }}>2. Intellectual Property Rights</p>
                        <p className=" text-lg content-primary-color">Our intellectual property</p>
                        <p className="text-lg content-sec-color">We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the 'Content'), as well as the trademarks, service marks, and logos contained therein (the 'Marks').</p>
                        <p className="text-lg content-sec-color">Our Content and Marks are protected by copyright and trademark laws and treaties in the United States and around the world. The Content and Marks are provided in or through the Services 'AS IS' for your personal, non-commercial use only.</p>

                        <p className="text-sm content-sec-color">Your use of our Services</p>
                        <p className="text-lg content-sec-color">Subject to your compliance with these Legal Terms, including the 'PROHIBITED ACTIVITIES' section below, we grant you a non-exclusive, non-transferable, revocable licence to:</p>
                        <ul className="privacy-list text-lg content-sec-color">
                            <li>Access the Services; and</li>
                            <li>Download or print a copy of any portion of the Content to which you have properly gained access,</li>
                        </ul>
                        <p className="text-lg content-sec-color">solely for your personal, non-commercial use.</p>
                        <p className="text-lg content-sec-color">Except as set out in this section or elsewhere in our Legal Terms, no part of the Services and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.</p>
                        <p className="text-lg content-sec-color">If you wish to make any use of the Services, Content, or Marks other than as set out in this section, please address your request to: <a href="mailto:hello@yescheff.co">hello@yescheff.co</a>.</p>
                        <p className="text-lg content-sec-color">We reserve all rights not expressly granted to you in and to the Services, Content, and Marks. Any breach of these Intellectual Property Rights will constitute a material breach of our Legal Terms and your right to use our Services will terminate immediately.</p>

                        <p className="text-sm content-sec-color">Your submissions and contributions</p>
                        <p className="text-lg content-sec-color">By directly sending us any question, comment, suggestion, idea, feedback, or other information about the Services ('Submissions'), you agree to assign to us all intellectual property rights in such Submission. You agree that we shall own this Submission and be entitled to its unrestricted use and dissemination for any lawful purpose, commercial or otherwise, without acknowledgment or compensation to you.</p>
                        <p className="text-lg content-sec-color">When you post Contributions, you grant us a licence (including use of your name, trademarks, and logos): By posting any Contributions, you grant us an unrestricted, unlimited, irrevocable, perpetual, non-exclusive, transferable, royalty-free, fully-paid, worldwide right, and licence to use, copy, reproduce, distribute, sell, resell, publish, broadcast, retitle, store, publicly perform, publicly display, reformat, translate, excerpt (in whole or in part), and exploit your Contributions for any purpose, commercial, advertising, or otherwise.</p>
                        <p className="text-lg content-sec-color">You are responsible for what you post or upload. By sending us Submissions and/or posting Contributions through any part of the Services, you confirm that you have read and agree with our 'PROHIBITED ACTIVITIES' and will not post, send, publish, upload, or transmit through the Services any Submission nor post any Contribution that is illegal, harassing, hateful, harmful, defamatory, obscene, bullying, abusive, discriminatory, threatening to any person or group, sexually explicit, false, inaccurate, deceitful, or misleading.</p>

                        {/* 3 */}
                        <p className="text-subtitle" id="tos-3" style={{ marginTop: '24px' }}>3. User Representations</p>
                        <p className="text-lg content-sec-color">By using the Services, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Legal Terms; (4) you are not a minor in the jurisdiction in which you reside, or if a minor, you have received parental permission to use the Services; (5) you will not access the Services through automated or non-human means, whether through a bot, script or otherwise; (6) you will not use the Services for any illegal or unauthorised purpose; and (7) your use of the Services will not violate any applicable law or regulation.</p>
                        <p className="text-lg content-sec-color">If you provide any information that is untrue, inaccurate, not current, or incomplete, we have the right to suspend or terminate your account and refuse any and all current or future use of the Services (or any portion thereof).</p>

                        {/* 4 */}
                        <p className="text-subtitle" id="tos-4" style={{ marginTop: '24px' }}>4. User Registration</p>
                        <p className="text-lg content-sec-color">You may be required to register to use the Services. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.</p>

                        {/* 5 */}
                        <p className="text-subtitle" id="tos-5" style={{ marginTop: '24px' }}>5. Purchases and Payment</p>
                        <p className="text-lg content-sec-color">We accept the following forms of payment:</p>
                        <ul className="privacy-list text-lg content-sec-color">
                            <li>Visa</li>
                            <li>Mastercard</li>
                            <li>American Express</li>
                            <li>Discover</li>
                            <li>PayPal</li>
                        </ul>
                        <p className="text-lg content-sec-color">You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services. You further agree to promptly update account and payment information, including email address, payment method, and payment card expiration date, so that we can complete your transactions and contact you as needed. Sales tax will be added to the price of purchases as deemed required by us. We may change prices at any time. All payments shall be in US dollars.</p>
                        <p className="text-lg content-sec-color">You agree to pay all charges at the prices then in effect for your purchases and any applicable shipping fees, and you authorise us to charge your chosen payment provider for any such amounts upon placing your order. We reserve the right to correct any errors or mistakes in pricing, even if we have already requested or received payment.</p>
                        <p className="text-lg content-sec-color">We reserve the right to refuse any order placed through the Services. We may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order.</p>

                        {/* 6 */}
                        <p className="text-subtitle" id="tos-6" style={{ marginTop: '24px' }}>6. Subscriptions</p>
                        <p className="text-lg content-primary-color">Billing and Renewal</p>
                        <p className="text-lg content-sec-color">Your subscription will continue and automatically renew unless cancelled. You consent to our charging your payment method on a recurring basis without requiring your prior approval for each recurring charge, until such time as you cancel the applicable order. The length of your billing cycle will depend on the type of subscription plan you choose when you subscribed to the Services.</p>
                        <p className="text-lg content-primary-color">Cancellation</p>
                        <p className="text-lg content-sec-color">All purchases are non-refundable. You can cancel your subscription at any time by logging into your account. Your cancellation will take effect at the end of the current paid term. If you have any questions or are unsatisfied with our Services, please email us at <a href="mailto:hello@yescheff.co">hello@yescheff.co</a>.</p>
                        <p className="text-lg content-primary-color">Fee Changes</p>
                        <p className="text-lg content-sec-color">We may, from time to time, make changes to the subscription fee and will communicate any price changes to you in accordance with applicable law.</p>

                        {/* 7 */}
                        <p className="text-subtitle" id="tos-7" style={{ marginTop: '24px' }}>7. Prohibited Activities</p>
                        <p className="text-lg content-sec-color">You may not access or use the Services for any purpose other than that for which we make the Services available. The Services may not be used in connection with any commercial endeavours except those that are specifically endorsed or approved by us.</p>
                        <p className="text-lg content-sec-color">As a user of the Services, you agree not to:</p>
                        <ul className="privacy-list text-lg content-sec-color">
                            <li>Systematically retrieve data or other content from the Services to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
                            <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
                            <li>Circumvent, disable, or otherwise interfere with security-related features of the Services.</li>
                            <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.</li>
                            <li>Use any information obtained from the Services in order to harass, abuse, or harm another person.</li>
                            <li>Make improper use of our support services or submit false reports of abuse or misconduct.</li>
                            <li>Use the Services in a manner inconsistent with any applicable laws or regulations.</li>
                            <li>Engage in unauthorised framing of or linking to the Services.</li>
                            <li>Upload or transmit viruses, Trojan horses, or other material that interferes with any party's uninterrupted use and enjoyment of the Services.</li>
                            <li>Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.</li>
                            <li>Delete the copyright or other proprietary rights notice from any Content.</li>
                            <li>Attempt to impersonate another user or person or use the username of another user.</li>
                            <li>Interfere with, disrupt, or create an undue burden on the Services or the networks or services connected to the Services.</li>
                            <li>Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services, or any portion of the Services.</li>
                            <li>Copy or adapt the Services' software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.</li>
                            <li>Except as permitted by applicable law, decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Services.</li>
                            <li>Use the Services as part of any effort to compete with us or otherwise use the Services and/or the Content for any revenue-generating endeavour or commercial enterprise.</li>
                            <li>Sell or otherwise transfer your profile.</li>
                        </ul>

                        {/* 8 */}
                        <p className="text-subtitle" id="tos-8" style={{ marginTop: '24px' }}>8. User Generated Contributions</p>
                        <p className="text-lg content-sec-color">The Services may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality, and may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Services, including but not limited to text, writings, video, audio, photographs, graphics, comments, suggestions, or personal information or other material (collectively, 'Contributions').</p>
                        <p className="text-lg content-sec-color">Contributions may be viewable by other users of the Services and through third-party websites. As such, any Contributions you transmit may be treated as non-confidential and non-proprietary. When you create or make available any Contributions, you thereby represent and warrant that:</p>
                        <ul className="privacy-list text-lg content-sec-color">
                            <li>The creation, distribution, transmission, public display, or performance, and the accessing, downloading, or copying of your Contributions do not and will not infringe the proprietary rights, including but not limited to the copyright, patent, trademark, trade secret, or moral rights of any third party.</li>
                            <li>You are the creator and owner of or have the necessary licences, rights, consents, releases, and permissions to use and to authorise us, the Services, and other users of the Services to use your Contributions.</li>
                            <li>Your Contributions are not false, inaccurate, or misleading.</li>
                            <li>Your Contributions are not unsolicited or unauthorised advertising, promotional materials, pyramid schemes, chain letters, spam, mass mailings, or other forms of solicitation.</li>
                            <li>Your Contributions are not obscene, lewd, lascivious, filthy, violent, harassing, libellous, slanderous, or otherwise objectionable (as determined by us).</li>
                            <li>Your Contributions do not violate any applicable law, regulation, or rule.</li>
                            <li>Your Contributions do not violate the privacy or publicity rights of any third party.</li>
                        </ul>
                        <p className="text-lg content-sec-color">Any use of the Services in violation of the foregoing violates these Legal Terms and may result in, among other things, termination or suspension of your rights to use the Services.</p>

                        {/* 9 */}
                        <p className="text-subtitle" id="tos-9" style={{ marginTop: '24px' }}>9. Contribution Licence</p>
                        <p className="text-lg content-sec-color">By posting your Contributions to any part of the Services, you automatically grant, and you represent and warrant that you have the right to grant, to us an unrestricted, unlimited, irrevocable, perpetual, non-exclusive, transferable, royalty-free, fully-paid, worldwide right, and licence to host, use, copy, reproduce, disclose, sell, resell, publish, broadcast, retitle, archive, store, cache, publicly perform, publicly display, reformat, translate, transmit, excerpt (in whole or in part), and distribute such Contributions for any purpose, commercial, advertising, or otherwise.</p>
                        <p className="text-lg content-sec-color">We do not assert any ownership over your Contributions. You retain full ownership of all of your Contributions and any intellectual property rights or other proprietary rights associated with your Contributions. We are not liable for any statements or representations in your Contributions provided by you in any area on the Services.</p>

                        {/* 10 */}
                        <p className="text-subtitle" id="tos-10" style={{ marginTop: '24px' }}>10. Social Media</p>
                        <p className="text-lg content-sec-color">As part of the functionality of the Services, you may link your account with online accounts you have with third-party service providers (each such account, a 'Third-Party Account') by either: (1) providing your Third-Party Account login information through the Services; or (2) allowing us to access your Third-Party Account, as is permitted under the applicable terms and conditions that govern your use of each Third-Party Account.</p>
                        <p className="text-lg content-sec-color">PLEASE NOTE THAT YOUR RELATIONSHIP WITH THE THIRD-PARTY SERVICE PROVIDERS ASSOCIATED WITH YOUR THIRD-PARTY ACCOUNTS IS GOVERNED SOLELY BY YOUR AGREEMENT(S) WITH SUCH THIRD-PARTY SERVICE PROVIDERS.</p>

                        {/* 11 */}
                        <p className="text-subtitle" id="tos-11" style={{ marginTop: '24px' }}>11. Third-Party Websites and Content</p>
                        <p className="text-lg content-sec-color">The Services may contain (or you may be sent via the Site) links to other websites ('Third-Party Websites') as well as articles, photographs, text, graphics, pictures, designs, music, sound, video, information, applications, software, and other content or items belonging to or originating from third parties ('Third-Party Content'). Such Third-Party Websites and Third-Party Content are not investigated, monitored, or checked for accuracy, appropriateness, or completeness by us, and we are not responsible for any Third-Party Websites accessed through the Services or any Third-Party Content posted on, available through, or installed from the Services.</p>
                        <p className="text-lg content-sec-color">If you decide to leave the Services and access the Third-Party Websites or to use or install any Third-Party Content, you do so at your own risk, and you should be aware these Legal Terms no longer govern.</p>

                        {/* 12 */}
                        <p className="text-subtitle" id="tos-12" style={{ marginTop: '24px' }}>12. Services Management</p>
                        <p className="text-lg content-sec-color">We reserve the right, but not the obligation, to: (1) monitor the Services for violations of these Legal Terms; (2) take appropriate legal action against anyone who, in our sole discretion, violates the law or these Legal Terms; (3) in our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable any of your Contributions or any portion thereof; (4) in our sole discretion and without limitation, notice, or liability, to remove from the Services or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems; and (5) otherwise manage the Services in a manner designed to protect our rights and property and to facilitate the proper functioning of the Services.</p>

                        {/* 13 */}
                        <p className="text-subtitle" id="tos-13" style={{ marginTop: '24px' }}>13. Privacy Policy</p>
                        <p className="text-lg content-sec-color">We care about data privacy and security. By using the Services, you agree to be bound by our Privacy Policy posted on the Services, which is incorporated into these Legal Terms. Please be advised the Services are hosted in the United Kingdom. If you access the Services from any other region of the world with laws or other requirements governing personal data collection, use, or disclosure that differ from applicable laws in the United Kingdom, then through your continued use of the Services, you are transferring your data to the United Kingdom, and you expressly consent to have your data transferred to and processed in the United Kingdom.</p>

                        {/* 14 */}
                        <p className="text-subtitle" id="tos-14" style={{ marginTop: '24px' }}>14. Copyright Infringements</p>
                        <p className="text-lg content-sec-color">We respect the intellectual property rights of others. If you believe that any material available on or through the Services infringes upon any copyright you own or control, please immediately notify us using the contact information provided below (a 'Notification'). A copy of your Notification will be sent to the person who posted or stored the material addressed in the Notification. Please be advised that pursuant to applicable law you may be held liable for damages if you make material misrepresentations in a Notification.</p>

                        {/* 15 */}
                        <p className="text-subtitle" id="tos-15" style={{ marginTop: '24px' }}>15. Term and Termination</p>
                        <p className="text-lg content-sec-color">These Legal Terms shall remain in full force and effect while you use the Services. WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE LEGAL TERMS OR OF ANY APPLICABLE LAW OR REGULATION.</p>
                        <p className="text-lg content-sec-color">If we terminate or suspend your account for any reason, you are prohibited from registering and creating a new account under your name, a fake or borrowed name, or the name of any third party, even if you may be acting on behalf of the third party.</p>

                        {/* 16 */}
                        <p className="text-subtitle" id="tos-16" style={{ marginTop: '24px' }}>16. Modifications and Interruptions</p>
                        <p className="text-lg content-sec-color">We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Services. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Services.</p>
                        <p className="text-lg content-sec-color">We cannot guarantee the Services will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Services, resulting in interruptions, delays, or errors. We reserve the right to change, revise, update, suspend, discontinue, or otherwise modify the Services at any time or for any reason without notice to you.</p>

                        {/* 17 */}
                        <p className="text-subtitle" id="tos-17" style={{ marginTop: '24px' }}>17. Governing Law</p>
                        <p className="text-lg content-sec-color">These Legal Terms are governed by and interpreted following the laws of England and Wales, and the use of the United Nations Convention of Contracts for the International Sales of Goods is expressly excluded. If your habitual residence is in the EU, and you are a consumer, you additionally possess the protection provided to you by obligatory provisions of the law in your country of residence. Yescheff.co and yourself both agree to submit to the non-exclusive jurisdiction of the courts of London.</p>

                        {/* 18 */}
                        <p className="text-subtitle" id="tos-18" style={{ marginTop: '24px' }}>18. Dispute Resolution</p>
                        <p className="text-lg content-primary-color">Informal Negotiations</p>
                        <p className="text-lg content-sec-color">To expedite resolution and control the cost of any dispute, controversy, or claim related to these Legal Terms (each a 'Dispute' and collectively, the 'Disputes') brought by either you or us (individually, a 'Party' and collectively, the 'Parties'), the Parties agree to first attempt to negotiate any Dispute informally for at least thirty (30) days before initiating arbitration. Such informal negotiations commence upon written notice from one Party to the other Party.</p>
                        <p className="text-lg content-primary-color">Binding Arbitration</p>
                        <p className="text-lg content-sec-color">Any dispute arising from the relationships between the Parties to these Legal Terms shall be determined by one arbitrator who will be chosen in accordance with the Arbitration and Internal Rules of the European Court of Arbitration being part of the European Centre of Arbitration having its seat in Strasbourg. The seat of arbitration shall be London, England. The language of the proceedings shall be English. Applicable rules of substantive law shall be the law of England.</p>
                        <p className="text-lg content-primary-color">Restrictions</p>
                        <p className="text-lg content-sec-color">The Parties agree that any arbitration shall be limited to the Dispute between the Parties individually. To the full extent permitted by law, (a) no arbitration shall be joined with any other proceeding; (b) there is no right or authority for any Dispute to be arbitrated on a class-action basis or to utilise class action procedures; and (c) there is no right or authority for any Dispute to be brought in a purported representative capacity on behalf of the general public or any other persons.</p>
                        <p className="text-lg content-primary-color">Exceptions to Informal Negotiations and Arbitration</p>
                        <p className="text-lg content-sec-color">The Parties agree that the following Disputes are not subject to the above provisions concerning informal negotiations binding arbitration: (a) any Disputes seeking to enforce or protect, or concerning the validity of, any of the intellectual property rights of a Party; (b) any Dispute related to, or arising from, allegations of theft, piracy, invasion of privacy, or unauthorised use; and (c) any claim for injunctive relief.</p>

                        {/* 19 */}
                        <p className="text-subtitle" id="tos-19" style={{ marginTop: '24px' }}>19. Corrections</p>
                        <p className="text-lg content-sec-color">There may be information on the Services that contains typographical errors, inaccuracies, or omissions, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the Services at any time, without prior notice.</p>

                        {/* 20 */}
                        <p className="text-subtitle" id="tos-20" style={{ marginTop: '24px' }}>20. Disclaimer</p>
                        <p className="text-lg content-sec-color">THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE SERVICES' CONTENT OR THE CONTENT OF ANY WEBSITES OR MOBILE APPLICATIONS LINKED TO THE SERVICES AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF THE SERVICES, (3) ANY UNAUTHORISED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED THEREIN.</p>

                        {/* 21 */}
                        <p className="text-subtitle" id="tos-21" style={{ marginTop: '24px' }}>21. Limitations of Liability</p>
                        <p className="text-lg content-sec-color">IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT PAID, IF ANY, BY YOU TO US DURING THE SIX (6) MONTH PERIOD PRIOR TO ANY CAUSE OF ACTION ARISING.</p>

                        {/* 22 */}
                        <p className="text-subtitle" id="tos-22" style={{ marginTop: '24px' }}>22. Indemnification</p>
                        <p className="text-lg content-sec-color">You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys' fees and expenses, made by any third party due to or arising out of: (1) your Contributions; (2) use of the Services; (3) breach of these Legal Terms; (4) any breach of your representations and warranties set forth in these Legal Terms; (5) your violation of the rights of a third party, including but not limited to intellectual property rights; or (6) any overt harmful act toward any other user of the Services with whom you connected via the Services.</p>

                        {/* 23 */}
                        <p className="text-subtitle" id="tos-23" style={{ marginTop: '24px' }}>23. User Data</p>
                        <p className="text-lg content-sec-color">We will maintain certain data that you transmit to the Services for the purpose of managing the performance of the Services, as well as data relating to your use of the Services. Although we perform regular routine backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Services. You agree that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action against us arising from any such loss or corruption of such data.</p>

                        {/* 24 */}
                        <p className="text-subtitle" id="tos-24" style={{ marginTop: '24px' }}>24. Electronic Communications, Transactions, and Signatures</p>
                        <p className="text-lg content-sec-color">Visiting the Services, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically, via email and on the Services, satisfy any legal requirement that such communication be in writing. YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR VIA THE SERVICES.</p>

                        {/* 25 */}
                        <p className="text-subtitle" id="tos-25" style={{ marginTop: '24px' }}>25. California Users and Residents</p>
                        <p className="text-lg content-sec-color">If any complaint with us is not satisfactorily resolved, you can contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs in writing at 1625 North Market Blvd., Suite N 112, Sacramento, California 95834 or by telephone at (800) 952-5210 or (916) 445-1254.</p>

                        {/* 26 */}
                        <p className="text-subtitle" id="tos-26" style={{ marginTop: '24px' }}>26. Miscellaneous</p>
                        <p className="text-lg content-sec-color">These Legal Terms and any policies or operating rules posted by us on the Services or in respect to the Services constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Legal Terms shall not operate as a waiver of such right or provision. These Legal Terms operate to the fullest extent permissible by law. We may assign any or all of our rights and obligations to others at any time. We shall not be responsible or liable for any loss, damage, delay, or failure to act caused by any cause beyond our reasonable control.</p>

                        {/* 27 */}
                        <p className="text-subtitle" id="tos-27" style={{ marginTop: '24px' }}>27. Contact Us</p>
                        <p className="text-lg content-sec-color">In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:</p>
                        <p className="text-lg content-sec-color">
                            Yescheff.co<br />
                            England<br />
                            <a href="mailto:hello@yescheff.co">hello@yescheff.co</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TermsOfService;
