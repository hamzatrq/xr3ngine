import Head from 'next/head';
import React, { useEffect } from 'react';
import ContactForm from '@xr3ngine/client-core/src/common/components/ContactForm';
import { useRouter } from 'next/router';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';

export const HomePage = (): any => {
    const router = useRouter();
    const { t } = useTranslation();
    useEffect(() => {
        if(Capacitor.isNative){
            router.push("/plugintest");
        }
    }, []);

    return (
        <div className="lander">
            <Head>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;400;600;800&display=swap" rel="stylesheet"/>
            </Head>
            <div className="lander-container">
                <div className="row mb-padding">
                    <object className="lander-logo" data="static/overlay_mark.svg" />
                </div>
                <div className="logo-bottom mb-padding">
                    <span className="main-txt gray-txt mr-2">{t('index.by')}</span>
                    <span className="main-txt gradiant-txt mr-2">{t('index.laguna')}</span>
                    <span className="main-txt white-txt">{t('index.labs')}</span>
                </div>
                <div className="row mt-5">
                    <div className="bottom-left mb-padding">
                        <div className="main-txt width-400">
                            {t('index.description')}
                        </div>
                    </div>
                    <object className="main-background" data="static/main-background.png" />
                    <div className="contact-right-div">
                        <ContactForm />
                    </div>
                </div>
                <div className="right-top-menu-row row">
                    <div className="right-top-menu">
                        <a target="_blank" href="https://discord.gg/mQ3D4FE">
                            <img className="discord-icon" src="static/discord.svg" />
                        </a>
                        <a target="_blank" href="https://github.com/xr3ngine/xr3ngine">
                            <img className="github-icon" src="static/github.svg" />
                        </a>
                    </div>
                    <div className="mobile-only">
                        <span className="main-txt gray-txt mr-2">{t('index.by')}</span>
                        <span className="main-txt gradiant-txt mr-2">{t('index.laguna')}</span>
                        <span className="main-txt white-txt">{t('index.labs')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
