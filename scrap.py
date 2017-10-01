import requests
import json
from pprint import pprint
import os
import sys

import wget

import sqlalchemy
from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy import create_engine

Base = declarative_base()

import logging
from bs4 import BeautifulSoup



class Job(Base):
    __tablename__ = 'job'
    # Here we define columns for the table address.
    # Notice that each column is also a normal Python instance attribute.
    id = Column(Integer, primary_key=True)
    location = Column(String(50), nullable=True)
    job_id = Column(String(20), nullable=True)
    position_title = Column(String(50), nullable=True)
    company_name = Column(String(60), nullable=True)
    library_type = Column(String(60), nullable=True)
    job_category = Column(String(60), nullable=True)
    job_type = Column(String(60), nullable=True)
    job_duration = Column(String(50), nullable=True)
    min_education = Column(String(50), nullable=True)
    min_experience = Column(String(50), nullable=True)
    required_travel = Column(String(20), nullable=True)
    link = Column(String(100), nullable=True)
    posted = Column(String(40), nullable=True)

    def __repr__(self):
        return "<job(position_title='%s')>" % self.position_title


class Description(Base):
    __tablename__ = 'description'
    # Here we define columns for the table address.
    # Notice that each column is also a normal Python instance attribute.
    id = Column(Integer, primary_key=True)
    description = Column(Text(), nullable=True)
    company_info = Column(Text(), nullable=True)
    job_id = Column(Integer, ForeignKey('job.id'))
    job = relationship(Job)


from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
engine = create_engine('sqlite:///library_jobs.db')
Base.metadata.create_all(engine)
Base.metadata.bind = engine
DBSession = sessionmaker(bind=engine)
session = DBSession()

# constants and Utilities
absolute_url = lambda link:'https://joblist.ala.org' + link

def fetch_the_website_content():
    try:
        result = requests.get('https://joblist.ala.org/jobseeker/search/results/?keywords=&kfields=&t731=&t732=&t735=&max=100&site_id=21926&search=')
        result = result.content
    except:
        #logging connection doesn't work
        sys.exit()
    return result

def main():
    result = fetch_the_website_content()

    soup = BeautifulSoup(result, 'lxml')

    job_summaries = soup.find_all("div",class_="job-summary-top-left")

    #create a list
    library_jobs_list = []

    for job in job_summaries[0:2]:
        #retrieve the Link
        link = job.a['href']
        url = absolute_url(link)

        # print(url)
        result = requests.get(url)
        if result.status_code == 200:
            content = result.content
        soup = BeautifulSoup(content, 'lxml')
        summary_div = soup.find('div', class_='job-data-basics')

        job_list = summary_div.find_all('li')


        #create a dictionnary
        my_dict = {}
        my_dict['link'] = url
        for li in job_list:
            if li.label.text.strip() == 'Location: '.strip():
                my_dict['location'] = li.span.text.strip()
            elif li.label.text.strip() == 'Job ID: '.strip():
                my_dict['job_id'] = li.span.text.strip()
            elif li.label.text.strip() == 'Posted: '.strip():
                my_dict['posted'] = li.span.text.strip()
            elif li.label.text.strip() == 'Position Title: '.strip():
                my_dict['position_title'] = li.span.text.strip()
            elif li.label.text.strip() == 'Company Name: '.strip():
                my_dict['company_name'] = li.span.text.strip()
            elif li.label.text.strip() == 'Library Type: '.strip():
                my_dict['library_type'] = li.span.text.strip()
            elif li.label.text.strip() == 'Job Category: '.strip():
                my_dict['job_category'] = li.span.text.strip()
            elif li.label.text.strip() == 'Job Type: '.strip():
                my_dict['job_type'] = li.span.text.strip()
            elif li.label.text.strip() == 'Job Duration: '.strip():
                my_dict['job_duration'] = li.span.text.strip()
            elif li.label.text.strip() == 'Min Education: '.strip():
                my_dict['min_education'] = li.span.text.strip()
            elif li.label.text.strip() == 'Min Experience: '.strip():
                my_dict['min_experience'] = li.span.text.strip()
            elif li.label.text.strip() == 'Required Travel: '.strip():
                my_dict['required_travel'] = li.span.text.strip()
            else:
                pass

        #find the description:
        description = soup.find('div', class_='generic-details-text').text
        try:
            company_info = soup.find('div', class_='company-info clearfix').text
        except AttributeError:
            company_info = None

        my_dict['description'] = description
        my_dict['company_info'] = company_info

        # print(my_dict)
        library_jobs_list.append(my_dict)
    # print(len(library_jobs_list))
    # pprint(library_jobs_list)
    # import sys; sys.exit()

    return library_jobs_list





def add_to_db():
    jobs = main()

    for job in jobs:
        company_info = job['company_info']
        del job['company_info']
        description = job['description']
        del job['description']
        if len(session.query(Job).filter(Job.job_id == job.get('job_id')).all()) == 0:
            new_job = Job(**job)
            session.add(new_job)
            session.commit()

            #Create the Description
            new_description = Description(
                description=description,
                company_info=company_info, job=new_job)
            session.add(new_description)
            session.commit()

            #download this page and save it to local
            wget.download(job.get('link'), out='backup_webpages/'+str(job.get('job_id'))+'.html')
        else:
            print('do not add this')

    pprint(session.query(Job).all())
    pprint(session.query(Description).all())

    #print(session.query(Job).first().job_id)
    jobs = session.query(Job).all()
    # import pdb; pdb.set_trace()
    for job in jobs:
        pprint(job.job_id)


add_to_db()
