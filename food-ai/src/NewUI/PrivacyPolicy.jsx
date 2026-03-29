import React from "react";
import { useNavigate } from 'react-router-dom';
import '../pages/Home.css';
import '../index.css';
import NewNavbar from "../NewUI/NewNavbar.jsx";
import './Menu.css';
import './Profile.css';

function PrivacyPolicy() {
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
                    <div className="page-title text-title">Privacy Policy</div>
                    <p className="text-sm" style={{ color: '#737373', marginBottom: '24px' }}>Last updated March 08, 2026</p>

                    <div className="privacy-content">
                        <p className="text-lg content-sec-color">
                            This Privacy Notice for Yescheff.co ('we', 'us', or 'our'), describes how and why we might access, collect, store, use, and/or share ('process') your personal information when you use our services ('Services'), including when you:
                        </p>
                        <ul className="privacy-list text-lg">
                            <li>Visit our website at <a href="https://yescheff.co" target="_blank" rel="noopener noreferrer">yescheff.co</a> or any website of ours that links to this Privacy Notice</li>
                            <li>Use YesCheff &mdash; a web app for learning, cooking, and saving your favorite recipes from cooking videos</li>
                            <li>Engage with us in other related ways, including any marketing or events</li>
                        </ul>
                        <p className="text-lg content-sec-color">
                            Questions or concerns? Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a href="mailto:hello@yescheff.co">hello@yescheff.co</a>.
                        </p>

                        <p className="text-subtitle" style={{ marginTop: '24px' }}>Summary of Key Points</p>
                        <p className="text-lg content-sec-color"><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</p>
                        <p className="text-lg content-sec-color"><strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.</p>
                        <p className="text-lg content-sec-color"><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</p>
                        <p className="text-lg content-sec-color"><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.</p>
                        <p className="text-lg content-sec-color"><strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties.</p>
                        <p className="text-lg content-sec-color"><strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.</p>
                        <p className="text-lg content-sec-color"><strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by submitting a data subject access request, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.</p>

                        <p className="text-subtitle" style={{ marginTop: '24px' }}>Table of Contents</p>
                        <ol className="privacy-toc text-lg">
                            <li><a href="#section-1">What Information Do We Collect?</a></li>
                            <li><a href="#section-2">How Do We Process Your Information?</a></li>
                            <li><a href="#section-3">What Legal Bases Do We Rely On to Process Your Personal Information?</a></li>
                            <li><a href="#section-4">When and With Whom Do We Share Your Personal Information?</a></li>
                            <li><a href="#section-5">Do We Use Cookies and Other Tracking Technologies?</a></li>
                            <li><a href="#section-6">Do We Offer Artificial Intelligence-Based Products?</a></li>
                            <li><a href="#section-7">How Long Do We Keep Your Information?</a></li>
                            <li><a href="#section-8">What Are Your Privacy Rights?</a></li>
                            <li><a href="#section-9">Controls for Do-Not-Track Features</a></li>
                            <li><a href="#section-10">Do United States Residents Have Specific Privacy Rights?</a></li>
                            <li><a href="#section-11">Do Other Regions Have Specific Privacy Rights?</a></li>
                            <li><a href="#section-12">Do We Make Updates to This Notice?</a></li>
                            <li><a href="#section-13">How Can You Contact Us About This Notice?</a></li>
                            <li><a href="#section-14">How Can You Review, Update, or Delete the Data We Collect From You?</a></li>
                        </ol>

                        {/* Section 1 */}
                        <p className="text-subtitle" style={{ marginTop: '24px' }} id="section-1">1. What Information Do We Collect?</p>
                        <p className="text-sm content-sec-color">Personal information you disclose to us</p>
                        <p className="text-lg content-sec-color"><em>In Short: We collect personal information that you provide to us.</em></p>
                        <p className="text-lg content-sec-color">We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</p>
                        <p className="text-lg content-sec-color"><strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:</p>
                        <ul className="privacy-list text-lg">
                            <li>Names</li>
                            <li>Email addresses</li>
                            <li>Contact preferences</li>
                        </ul>
                        <p className="text-lg content-sec-color"><strong>Sensitive Information.</strong> We do not process sensitive information.</p>
                        <p className="text-lg content-sec-color"><strong>Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases, such as your payment instrument number, and the security code associated with your payment instrument. All payment data is handled and stored by Stripe. You may find their privacy notice <a href="https://stripe.com/gb/privacy" target="_blank" rel="noopener noreferrer">here</a>.</p>
                        <p className="text-lg content-sec-color">All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.</p>

                        <p className="text-sm content-sec-color">Information automatically collected</p>
                        <p className="text-lg content-sec-color"><em>In Short: Some information &mdash; such as your Internet Protocol (IP) address and/or browser and device characteristics &mdash; is collected automatically when you visit our Services.</em></p>
                        <p className="text-lg content-sec-color">We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.</p>
                        <p className="text-lg content-sec-color">Like many businesses, we also collect information through cookies and similar technologies.</p>
                        <p className="text-lg content-sec-color">The information we collect includes:</p>
                        <ul className="privacy-list text-lg">
                            <li><strong>Log and Usage Data.</strong> Log and usage data is service-related, diagnostic, usage, and performance information our servers automatically collect when you access or use our Services and which we record in log files. This log data may include your IP address, device information, browser type, and settings and information about your activity in the Services, device event information (such as system activity, error reports, and hardware settings).</li>
                            <li><strong>Location Data.</strong> We collect location data such as information about your device's location, which can be either precise or imprecise. How much information we collect depends on the type and settings of the device you use to access the Services. You can opt out of allowing us to collect this information either by refusing access to the information or by disabling your Location setting on your device.</li>
                        </ul>

                        <p className="text-sm content-sec-color">Google API</p>
                        <p className="text-lg content-sec-color">Our use of information received from Google APIs will adhere to Google API Services User Data Policy, including the Limited Use requirements.</p>

                        {/* Section 2 */}
                        <p className="text-subtitle" style={{ marginTop: '24px' }} id="section-2">2. How Do We Process Your Information?</p>
                        <p className="text-lg content-sec-color"><em>In Short: We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</em></p>
                        <p className="text-lg content-sec-color">We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</p>
                        <ul className="privacy-list text-lg">
                            <li><strong>To facilitate account creation and authentication</strong> and otherwise manage user accounts.</li>
                            <li><strong>To deliver and facilitate delivery of services to the user.</strong> We may process your information to provide you with the requested service.</li>
                            <li><strong>To send administrative information to you.</strong> We may process your information to send you details about our products and services, changes to our terms and policies, and other similar information.</li>
                            <li><strong>To fulfil and manage your orders.</strong> We may process your information to fulfil and manage your orders, payments, returns, and exchanges made through the Services.</li>
                            <li><strong>To save or protect an individual's vital interest.</strong> We may process your information when necessary to save or protect an individual's vital interest, such as to prevent harm.</li>
                        </ul>

                        {/* Section 3 */}
                        <p className="text-subtitle" style={{ marginTop: '24px' }} id="section-3">3. What Legal Bases Do We Rely On to Process Your Information?</p>
                        <p className="text-lg content-sec-color"><em>In Short: We only process your personal information when we believe it is necessary and we have a valid legal reason (i.e. legal basis) to do so under applicable law, like with your consent, to comply with laws, to provide you with services to enter into or fulfil our contractual obligations, to protect your rights, or to fulfil our legitimate business interests.</em></p>

                        <p className="text-sm content-sec-color">If you are located in the EU or UK</p>
                        <p className="text-lg content-sec-color">The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the valid legal bases we rely on in order to process your personal information. As such, we may rely on the following legal bases:</p>
                        <ul className="privacy-list text-lg">
                            <li><strong>Consent.</strong> We may process your information if you have given us permission to use your personal information for a specific purpose. You can withdraw your consent at any time.</li>
                            <li><strong>Performance of a Contract.</strong> We may process your personal information when we believe it is necessary to fulfil our contractual obligations to you, including providing our Services or at your request prior to entering into a contract with you.</li>
                            <li><strong>Legal Obligations.</strong> We may process your information where we believe it is necessary for compliance with our legal obligations.</li>
                            <li><strong>Vital Interests.</strong> We may process your information where we believe it is necessary to protect your vital interests or the vital interests of a third party.</li>
                        </ul>

                        <p className="text-sm content-sec-color">If you are located in Canada</p>
                        <p className="text-lg content-sec-color">We may process your information if you have given us specific permission (i.e. express consent) to use your personal information for a specific purpose, or in situations where your permission can be inferred (i.e. implied consent). You can withdraw your consent at any time.</p>
                        <p className="text-lg content-sec-color">In some exceptional cases, we may be legally permitted under applicable law to process your information without your consent, including, for example:</p>
                        <ul className="privacy-list text-lg">
                            <li>If collection is clearly in the interests of an individual and consent cannot be obtained in a timely way</li>
                            <li>For investigations and fraud detection and prevention</li>
                            <li>For business transactions provided certain conditions are met</li>
                            <li>If it is contained in a witness statement and the collection is necessary to assess, process, or settle an insurance claim</li>
                            <li>For identifying injured, ill, or deceased persons and communicating with next of kin</li>
                            <li>If we have reasonable grounds to believe an individual has been, is, or may be victim of financial abuse</li>
                            <li>If disclosure is required to comply with a subpoena, warrant, court order, or rules of the court relating to the production of records</li>
                            <li>If the information is publicly available and is specified by the regulations</li>
                        </ul>

                        {/* Section 4 */}
                        <p className="text-subtitle" style={{ marginTop: '24px' }} id="section-4">4. When and With Whom Do We Share Your Personal Information?</p>
                        <p className="text-lg content-sec-color"><em>In Short: We may share information in specific situations described in this section and/or with the following third parties.</em></p>
                        <p className="text-lg content-sec-color">We may need to share your personal information in the following situations:</p>
                        <ul className="privacy-list text-lg">
                            <li><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
                            <li><strong>When we use Google Maps Platform APIs.</strong> We may share your information with certain Google Maps Platform APIs (e.g. Google Maps API, Places API). We use certain Google Maps Platform APIs to retrieve certain information when you make location-specific requests. This includes grocery stores and other similar information. Google Maps uses GPS, Wi-Fi, and cell towers to estimate your location.</li>
                        </ul>

                        {/* Section 5 */}
                        <p className="text-subtitle" style={{ marginTop: '24px' }} id="section-5">5. Do We Use Cookies and Other Tracking Technologies?</p>
                        <p className="text-lg content-sec-color"><em>In Short: We may use cookies and other tracking technologies to collect and store your information.</em></p>
                        <p className="text-lg content-sec-color">We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services and your account, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.</p>
                        <p className="text-lg content-sec-color">We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements, to tailor advertisements to your interests, or to send abandoned shopping cart reminders (depending on your communication preferences).</p>

                        <p className="text-sm content-sec-color">Google Analytics</p>
                        <p className="text-lg content-sec-color">We may share your information with Google Analytics to track and analyse the use of the Services. The Google Analytics Advertising Features that we may use include Google Analytics Demographics and Interests Reporting. To opt out of being tracked by Google Analytics across the Services, visit <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">https://tools.google.com/dlpage/gaoptout</a>.</p>

                        {/* Section 6 */}
                        <p className="text-subtitle" style={{ marginTop: '24px' }} id="section-6">6. Do We Offer Artificial Intelligence-Based Products?</p>
                        <p className="text-lg content-sec-color"><em>In Short: We offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies.</em></p>
                        <p className="text-lg content-sec-color">As part of our Services, we offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies (collectively, 'AI Products'). These tools are designed to enhance your experience and provide you with innovative solutions.</p>

                        <p className="text-sm content-sec-color">Use of AI Technologies</p>
                        <p className="text-lg content-sec-color">We provide the AI Products through third-party service providers ('AI Service Providers'), including OpenAI. As outlined in this Privacy Notice, your input, output, and personal information will be shared with and processed by these AI Service Providers to enable your use of our AI Products. You must not use the AI Products in any way that violates the terms or policies of any AI Service Provider.</p>

                        <p className="text-sm content-sec-color">Our AI Products</p>
                        <p className="text-lg content-sec-color">Our AI Products are designed for the following functions:</p>
                        <ul className="privacy-list text-lg">
                            <li>Text analysis</li>
                            <li>Video analysis</li>
                            <li>AI search</li>
                            <li>AI translation</li>
                        </ul>

                        <p className="text-sm content-sec-color">How We Process Your Data Using AI</p>
                        <p className="text-lg content-sec-color">All personal information processed using our AI Products is handled in line with our Privacy Notice and our agreement with third parties. This ensures high security and safeguards your personal information throughout the process, giving you peace of mind about your data's safety.</p>

                        {/* Section 7 */}
                        <p className="text-subtitle" style={{ marginTop: '24px' }} id="section-7">7. How Long Do We Keep Your Information?</p>
                        <p className="text-lg content-sec-color"><em>In Short: We keep your information for as long as necessary to fulfil the purposes outlined in this Privacy Notice unless otherwise required by law.</em></p>
                        <p className="text-lg content-sec-color">We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.</p>
                        <p className="text-lg content-sec-color">When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymise such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.</p>

                        {/* Section 8 */}
                        <p className="text-subtitle" style={{ marginTop: '24px' }} id="section-8">8. What Are Your Privacy Rights?</p>
                        <p className="text-lg content-sec-color"><em>In Short: Depending on your state of residence in the US or in some regions, such as the European Economic Area (EEA), United Kingdom (UK), Switzerland, and Canada, you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time.</em></p>
                        <p className="text-lg content-sec-color">In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; (iv) if applicable, to data portability; and (v) not to be subject to automated decision-making.</p>
                        <p className="text-lg content-sec-color"><strong>Withdrawing your consent:</strong> If we are relying on your consent to process your personal information, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us using the contact details provided below.</p>
                        <p className="text-lg content-sec-color"><strong>Opting out of marketing and promotional communications:</strong> You can unsubscribe from our marketing and promotional communications at any time by clicking on the unsubscribe link in the emails that we send, or by contacting us. You will then be removed from the marketing lists.</p>

                        <p className="text-sm content-sec-color">Account Information</p>
                        <p className="text-lg content-sec-color">If you would at any time like to review or change the information in your account or terminate your account, you can log in to your account settings and update your user account. Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.</p>
                        <p className="text-lg content-sec-color"><strong>Cookies and similar technologies:</strong> Most web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could affect certain features or services of our Services.</p>
                        <p className="text-lg content-sec-color">If you have questions or comments about your privacy rights, you may email us at <a href="mailto:hello@yescheff.co">hello@yescheff.co</a>.</p>

                        {/* Section 9 */}
                        <p className="text-subtitle" style={{ marginTop: '24px' }} id="section-9">9. Controls for Do-Not-Track Features</p>
                        <p className="text-lg content-sec-color">Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ('DNT') feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognising and implementing DNT signals has been finalised. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online.</p>

                        {/* Section 10 */}
                        <p className="text-subtitle" style={{ marginTop: '24px' }} id="section-10">10. Do United States Residents Have Specific Privacy Rights?</p>
                        <p className="text-lg content-sec-color"><em>In Short: If you are a resident of certain US states, you may have the right to request access to and receive details about the personal information we maintain about you and how we have processed it, correct inaccuracies, get a copy of, or delete your personal information.</em></p>

                        <p className="text-sm content-sec-color">Your Rights</p>
                        <p className="text-lg content-sec-color">You have rights under certain US state data protection laws. These rights include:</p>
                        <ul className="privacy-list text-lg">
                            <li>Right to know whether or not we are processing your personal data</li>
                            <li>Right to access your personal data</li>
                            <li>Right to correct inaccuracies in your personal data</li>
                            <li>Right to request the deletion of your personal data</li>
                            <li>Right to obtain a copy of the personal data you previously shared with us</li>
                            <li>Right to non-discrimination for exercising your rights</li>
                            <li>Right to opt out of the processing of your personal data if it is used for targeted advertising, the sale of personal data, or profiling</li>
                        </ul>

                        <p className="text-sm content-sec-color">How to Exercise Your Rights</p>
                        <p className="text-lg content-sec-color">To exercise these rights, you can contact us by submitting a data subject access request, by emailing us at <a href="mailto:hello@yescheff.co">hello@yescheff.co</a>, or by referring to the contact details at the bottom of this document.</p>

                        <p className="text-sm content-sec-color">Appeals</p>
                        <p className="text-lg content-sec-color">Under certain US state data protection laws, if we decline to take action regarding your request, you may appeal our decision by emailing us at <a href="mailto:hello@yescheff.co">hello@yescheff.co</a>. We will inform you in writing of any action taken or not taken in response to the appeal, including a written explanation of the reasons for the decisions.</p>

                        {/* Section 11 */}
                        <p className="text-subtitle" style={{ marginTop: '24px' }} id="section-11">11. Do Other Regions Have Specific Privacy Rights?</p>
                        <p className="text-lg content-sec-color"><em>In Short: You may have additional rights based on the country you reside in.</em></p>

                        <p className="text-sm content-sec-color">Australia and New Zealand</p>
                        <p className="text-lg content-sec-color">We collect and process your personal information under the obligations and conditions set by Australia's Privacy Act 1988 and New Zealand's Privacy Act 2020. At any time, you have the right to request access to or correction of your personal information. If you believe we are unlawfully processing your personal information, you have the right to submit a complaint to the Office of the Australian Information Commissioner or the Office of New Zealand Privacy Commissioner.</p>

                        <p className="text-sm content-sec-color">Republic of South Africa</p>
                        <p className="text-lg content-sec-color">At any time, you have the right to request access to or correction of your personal information. If you are unsatisfied with the manner in which we address any complaint with regard to our processing of personal information, you can contact the office of the regulator, the Information Regulator (South Africa):</p>
                        <ul className="privacy-list text-lg">
                            <li>General enquiries: <a href="mailto:enquiries@inforegulator.org.za">enquiries@inforegulator.org.za</a></li>
                            <li>Complaints: <a href="mailto:PAIAComplaints@inforegulator.org.za">PAIAComplaints@inforegulator.org.za</a> & <a href="mailto:POPIAComplaints@inforegulator.org.za">POPIAComplaints@inforegulator.org.za</a></li>
                        </ul>

                        {/* Section 12 */}
                        <p className="text-subtitle" style={{ marginTop: '24px' }} id="section-12">12. Do We Make Updates to This Notice?</p>
                        <p className="text-lg content-sec-color"><em>In Short: Yes, we will update this notice as necessary to stay compliant with relevant laws.</em></p>
                        <p className="text-lg content-sec-color">We may update this Privacy Notice from time to time. The updated version will be indicated by an updated 'Revised' date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.</p>

                        {/* Section 13 */}
                        <p className="text-subtitle" style={{ marginTop: '24px' }} id="section-13">13. How Can You Contact Us About This Notice?</p>
                        <p className="text-lg content-sec-color">If you have questions or comments about this notice, you may email us at <a href="mailto:hello@yescheff.co">hello@yescheff.co</a> or contact us by post at:</p>
                        <p className="text-lg content-sec-color">
                            Yescheff.co<br />
                            London, United Kingdom
                        </p>

                        {/* Section 14 */}
                        <p className="text-subtitle" style={{ marginTop: '24px' }} id="section-14">14. How Can You Review, Update, or Delete the Data We Collect From You?</p>
                        <p className="text-lg content-sec-color">Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please contact us at <a href="mailto:hello@yescheff.co">hello@yescheff.co</a>.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicy;
